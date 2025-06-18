SELECT
  n.id,
  n.type,
  n.title,
  n.message,
  n.invoice_id,
  n.created_by,
  n.created_at,
  n.metadata,
  nr.read_at,
  nr.user_id,
  n.organization_id
FROM
  (
    notifications n
    JOIN notification_recipients nr ON ((n.id = nr.notification_id))
  )
WHERE
  (n.deleted_at IS NULL);