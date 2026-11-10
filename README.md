# 5:00 · Kerberos has a five-minute wall

An interactive explainer of Kerberos clock skew: why a valid ticket gets rejected when two clocks disagree by more than the allowed amount (five minutes by default), and how to tell *which* machine to fix.

Everything runs in your browser. A strict Content-Security-Policy (`connect-src 'none'`) blocks all network requests. There are no dependencies.

## What's in it

- **Hero:** two live analog clocks; the client drifts ahead until it crosses the wall
- **01 · Break the clocks:** a simulator with client, KDC (the reference) and service clocks. The stage that fails tells you whose clock is wrong
- **02 · Why five minutes:** the window as a replay-cache memory limit
- **03 · Tickets have clocks too:** `KRB_AP_ERR_TKT_NYV` and `KRB_AP_ERR_TKT_EXPIRED`
- **04 · The usual suspects**, and **05 · Find it, fix it** with comparison commands for Linux and Windows

## Run locally

Plain static files (HTML, CSS, vanilla JS). Serve the folder with anything:

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

Then open <http://localhost:4174>.

## Notes

- This is a simplified simulation. Real implementations differ in details such as replay-cache storage, exact error text and time-offset recovery.
- The default allowed skew is 300 seconds (MIT `clockskew`). Skew, ticket start and ticket end checks fail only when the difference is *more than* the allowance.
- Hostnames in examples (`dc.example.com`, `EXAMPLE.COM`) are placeholders.

## Sources

- [RFC 4120: The Kerberos Network Authentication Service (V5)](https://www.rfc-editor.org/rfc/rfc4120)
- [MIT krb5.conf reference](https://web.mit.edu/kerberos/krb5-latest/doc/admin/conf_files/krb5_conf.html)
- [Microsoft: Authentication errors are caused by unsynchronized clocks](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc780011(v=ws.10))
