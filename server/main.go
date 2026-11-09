// grib-lb: leaderboard for ГРИБ: Versus, the only place scores live. SQLite file.
// Public API, HTTPS on a public hostname so browsers on tailnet devices do not see a local address:
//
//	GET  /?prefix=v2:      -> [["v2:NAME",score],...]
//	POST /v2:NAME  body=N  -> keeps the max score per key
//
// Admin API on a loopback port that is not funneled: GET / lists all, DELETE /KEY removes a row.
// CLI on the server: `grib-lb ls`, `grib-lb rm NAME|KEY...`.
package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"golang.org/x/crypto/acme/autocert"
	_ "modernc.org/sqlite"
)

var db *sql.DB

const adminAddr = "127.0.0.1:8789"

func main() {
	if len(os.Args) > 1 && (os.Args[1] == "ls" || os.Args[1] == "rm" || os.Args[1] == "stats") {
		os.Exit(cli(os.Args[1], os.Args[2:]))
	}
	addr := flag.String("addr", "127.0.0.1:8790", "listen address")
	path := flag.String("db", "scores.db", "SQLite file")
	host := flag.String("tls-host", "", "public hostname: serve HTTPS with a Let's Encrypt certificate")
	tlsAddr := flag.String("tls-addr", ":8445", "HTTPS listen address, with -tls-host")
	certs := flag.String("certs", "certs", "certificate cache directory, with -tls-host")
	flag.Parse()
	var err error
	db, err = sql.Open("sqlite", "file:"+*path+"?_pragma=journal_mode(WAL)&_pragma=synchronous(FULL)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE IF NOT EXISTS scores(k TEXT PRIMARY KEY, s INTEGER NOT NULL, t INTEGER NOT NULL)`); err != nil {
		log.Fatal(err)
	}
	// anonymous run counter: only (UTC day, event) -> count, no ids or addresses
	if _, err = db.Exec(`CREATE TABLE IF NOT EXISTS ev(day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY(day, k))`); err != nil {
		log.Fatal(err)
	}
	srv := &http.Server{Addr: *addr, Handler: http.HandlerFunc(handle), ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	adm := &http.Server{Addr: adminAddr, Handler: http.HandlerFunc(admin), ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	go func() { log.Fatal(adm.ListenAndServe()) }()
	if *host != "" {
		m := &autocert.Manager{Prompt: autocert.AcceptTOS, HostPolicy: autocert.HostWhitelist(*host), Cache: autocert.DirCache(*certs)}
		go func() { log.Fatal(http.ListenAndServe(":80", m.HTTPHandler(nil))) }() // ACME HTTP-01: 443 is taken by the VPN container
		pub := &http.Server{Addr: *tlsAddr, Handler: http.HandlerFunc(handle), TLSConfig: m.TLSConfig(), ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
		go func() { log.Fatal(pub.ListenAndServeTLS("", "")) }()
	}
	log.Printf("grib-lb on %s (admin %s), db %s", *addr, adminAddr, *path)
	log.Fatal(srv.ListenAndServe())
}

func handle(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	h.Set("Cache-Control", "no-store")
	switch {
	case r.Method == http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
	case r.Method == http.MethodGet && r.URL.Path == "/":
		list(w, r.URL.Query().Get("prefix"))
	case r.Method == http.MethodPost && r.URL.Path == "/ev":
		count(w, r)
	case r.Method == http.MethodPost:
		put(w, r)
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func list(w http.ResponseWriter, prefix string) {
	rows, err := db.Query(`SELECT k, s FROM scores WHERE substr(k, 1, length(?1)) = ?1 ORDER BY s DESC`, prefix)
	if err != nil {
		http.Error(w, "db", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	out := [][2]any{}
	for rows.Next() {
		var k string
		var s int64
		if rows.Scan(&k, &s) == nil {
			out = append(out, [2]any{k, s})
		}
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(out)
}

var dayRe = regexp.MustCompile(`^day:\d{4}-\d{2}-\d{2}:`)

// validKey accepts v2:NAME (main board), v2s:NAME (secret nicks) and day:YYYY-MM-DD:NAME (daily run).
func validKey(k string) bool {
	name, ok := strings.CutPrefix(k, "v2s:")
	if !ok {
		name, ok = strings.CutPrefix(k, "v2:")
	}
	if !ok && dayRe.MatchString(k) {
		name, ok = k[15:], true
	}
	if !ok || name == "" || !utf8.ValidString(name) || utf8.RuneCountInString(name) > 16 {
		return false
	}
	for _, c := range name {
		if unicode.IsControl(c) {
			return false
		}
	}
	return true
}

// upKey uppercases the name part, so "v2:дутый" and "v2:ДУТЫЙ" are one row.
func upKey(k string) string {
	if i := strings.IndexByte(k, ':'); i >= 0 {
		return k[:i+1] + strings.ToUpper(k[i+1:])
	}
	return k
}

func put(w http.ResponseWriter, r *http.Request) {
	k := upKey(strings.TrimPrefix(r.URL.Path, "/"))
	body, _ := io.ReadAll(io.LimitReader(r.Body, 32))
	s, err := strconv.ParseInt(strings.TrimSpace(string(body)), 10, 64)
	if !validKey(k) || err != nil || s < 0 || s > 100_000_000 {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	_, err = db.Exec(`INSERT INTO scores(k, s, t) VALUES(?1, ?2, ?3)
		ON CONFLICT(k) DO UPDATE SET s = excluded.s, t = excluded.t WHERE excluded.s > scores.s`, k, s, time.Now().Unix())
	if err != nil {
		http.Error(w, "db", http.StatusInternalServerError)
		return
	}
	io.WriteString(w, "ok")
}

var evRe = regexp.MustCompile(`^[a-z]{2,8}(:[a-z0-9]{1,12}){0,2}$`)

// count adds one to today's counter for an event like "start:first" or "end:12:pit".
func count(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(io.LimitReader(r.Body, 64))
	k := strings.TrimSpace(string(body))
	if !evRe.MatchString(k) {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	day := time.Now().UTC().Format("2006-01-02")
	if _, err := db.Exec(`INSERT INTO ev(day, k, n) VALUES(?1, ?2, 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1`, day, k); err != nil {
		http.Error(w, "db", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func admin(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/ev" {
		rows, err := db.Query(`SELECT day, k, n FROM ev WHERE day >= ?1 ORDER BY day, k`, r.URL.Query().Get("since"))
		if err != nil {
			http.Error(w, "db", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		out := [][3]any{}
		for rows.Next() {
			var d, k string
			var n int64
			if rows.Scan(&d, &k, &n) == nil {
				out = append(out, [3]any{d, k, n})
			}
		}
		json.NewEncoder(w).Encode(out)
		return
	}
	switch r.Method {
	case http.MethodGet:
		list(w, "")
	case http.MethodDelete:
		res, err := db.Exec(`DELETE FROM scores WHERE k = ?`, upKey(strings.TrimPrefix(r.URL.Path, "/")))
		if err != nil {
			http.Error(w, "db", http.StatusInternalServerError)
			return
		}
		n, _ := res.RowsAffected()
		fmt.Fprintln(w, n)
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func cli(cmd string, args []string) int {
	base := "http://" + adminAddr + "/"
	if cmd == "stats" {
		return stats(base, args)
	}
	if cmd == "ls" {
		resp, err := http.Get(base)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			return 1
		}
		defer resp.Body.Close()
		var rows [][2]any
		json.NewDecoder(resp.Body).Decode(&rows)
		for _, r := range rows {
			fmt.Printf("%v\t%v\n", r[0], r[1])
		}
		return 0
	}
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: grib-lb rm NAME|v2:NAME|v2s:NAME|day:YYYY-MM-DD:NAME ...")
		return 2
	}
	code := 0
	for _, a := range args {
		keys := []string{"v2:" + a, "v2s:" + a} // bare name: both boards
		if strings.HasPrefix(a, "v2:") || strings.HasPrefix(a, "v2s:") || dayRe.MatchString(a) {
			keys = []string{a}
		}
		for _, k := range keys {
			req, _ := http.NewRequest(http.MethodDelete, base+url.PathEscape(k), nil)
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				code = 1
				continue
			}
			n, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			fmt.Printf("%s: deleted %s", upKey(k), n)
		}
	}
	return code
}

// stats prints the funnel for the last N days (default 7): runs by player kind,
// shares, and where runs end (level and cause).
func stats(base string, args []string) int {
	days := 7
	if len(args) > 0 {
		if n, err := strconv.Atoi(args[0]); err == nil && n > 0 {
			days = n
		}
	}
	since := time.Now().UTC().AddDate(0, 0, -days+1).Format("2006-01-02")
	resp, err := http.Get(base + "ev?since=" + since)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer resp.Body.Close()
	var rows [][3]any
	json.NewDecoder(resp.Body).Decode(&rows)
	type dayRow struct{ first, ret, same, daily, share int }
	perDay := map[string]*dayRow{}
	var order []string
	lvl := map[int]int{}
	cause := map[string]int{}
	ends := 0
	for _, r := range rows {
		d, k, n := r[0].(string), r[1].(string), int(r[2].(float64))
		if perDay[d] == nil {
			perDay[d] = &dayRow{}
			order = append(order, d)
		}
		p := strings.Split(k, ":")
		switch {
		case k == "start:first":
			perDay[d].first += n
		case k == "start:ret":
			perDay[d].ret += n
		case k == "start:same":
			perDay[d].same += n
		case k == "share":
			perDay[d].share += n
		case p[0] == "daily":
			perDay[d].daily += n
		case p[0] == "end" && len(p) == 3:
			l, _ := strconv.Atoi(p[1])
			lvl[l] += n
			cause[p[2]] += n
			ends += n
		}
	}
	fmt.Printf("since %s (UTC days)\n\nday         new  back  again  daily  shares\n", since)
	for _, d := range order {
		r := perDay[d]
		fmt.Printf("%s  %4d  %4d  %5d  %5d  %6d\n", d, r.first, r.ret, r.same, r.daily, r.share)
	}
	fmt.Printf("\nruns ended: %d\nlevel reached:\n", ends)
	var ls []int
	for l := range lvl {
		ls = append(ls, l)
	}
	sort.Ints(ls)
	for _, l := range ls {
		fmt.Printf("  %3d  %5d  %s\n", l, lvl[l], strings.Repeat("#", (lvl[l]*40+ends-1)/max(ends, 1)))
	}
	fmt.Println("cause:")
	var cs []string
	for c := range cause {
		cs = append(cs, c)
	}
	sort.Slice(cs, func(i, j int) bool { return cause[cs[i]] > cause[cs[j]] })
	for _, c := range cs {
		fmt.Printf("  %-8s %5d\n", c, cause[c])
	}
	return 0
}
