CREATE TABLE notification_cool_off_tracker (
  event_type VARCHAR PRIMARY KEY,
  last_triggered_at TIMESTAMPTZ
);

INSERT INTO notification_cool_off_tracker (event_type) VALUES ('price_changed'); 
