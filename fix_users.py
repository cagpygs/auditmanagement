import psycopg2
try:
    conn = psycopg2.connect(host='host.docker.internal', database='Irrigation', user='postgres', password='123456', port='5432')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_draft = FALSE WHERE is_draft = TRUE;")
    print(f"Updated {cur.rowcount} users from is_draft=TRUE to is_draft=FALSE.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals() and conn:
        conn.close()
