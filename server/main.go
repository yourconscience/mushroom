// grib-lb: leaderboard for ГРИБ: Versus. SQLite file, kvdb-compatible API:
//   GET  /?prefix=v2:      -> [["v2:NAME",score],...]
//   POST /v2:NAME  body=N  -> keeps the max score per key
// No deletes. Old kvdb clients and this server can be read side by side.
package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func main() {
	addr := flag.String("addr", "127.0.0.1:8790", "listen address")
	path := flag.String("db", "scores.db", "SQLite file")
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
	srv := &http.Server{Addr: *addr, Handler: http.HandlerFunc(handle), ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	log.Printf("grib-lb on %s, db %s", *addr, *path)
	log.Fatal(srv.ListenAndServe())
}

func handle(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	h.Set("Cache-Control", "no-store")
	h.Set("Access-Control-Allow-Private-Network", "true") // Chrome preflight for pages reaching a tailnet address
	switch {
	case r.Method == http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
	case r.Method == http.MethodGet && r.URL.Path == "/":
		list(w, r.URL.Query().Get("prefix"))
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

func validKey(k string) bool {
	name, ok := strings.CutPrefix(k, "v2s:")
	if !ok {
		name, ok = strings.CutPrefix(k, "v2:")
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

func put(w http.ResponseWriter, r *http.Request) {
	k := strings.TrimPrefix(r.URL.Path, "/")
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
