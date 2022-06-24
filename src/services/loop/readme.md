Loop 
====

Start the loopserver (Mock Swap Server) and loopclient (Rest API)
```
make start-loop
```

A successful loop server start returns this

```
{"swap_fee_sat":"50", "prepay_amt_sat":"1337", "htlc_sweep_fee_sat":"7262", "swap_payment_dest":"A31dVAIzvYn1p/0J7WG3DS7Qbq5FIzWhPgtHQngozskq", "cltv_delta":0, "conf_target":9}
```

Test Loop Out
------------
```
TEST=loop-service make unit
```