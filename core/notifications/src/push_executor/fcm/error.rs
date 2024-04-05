use thiserror::Error;

#[derive(Debug, Error)]
pub enum FcmError {
    #[error("FcmError - I/O Error: {0}")]
    IOError(#[from] std::io::Error),
    #[error("FcmError - GoogleFcm1Error: {0}")]
    GoogleFcm1Error(google_fcm1::Error),
    #[error("FcmError: StaleDeviceToken: {0}")]
    StaleDeviceToken(google_fcm1::Error),
}

impl From<google_fcm1::Error> for FcmError {
    fn from(err: google_fcm1::Error) -> Self {
        match err {
            google_fcm1::Error::BadRequest(ref value) => {
                let code = value
                    .get("error")
                    .and_then(|e| e.get("code"))
                    .and_then(|c| c.as_u64());

                let status = value
                    .get("error")
                    .and_then(|e| e.get("status"))
                    .and_then(|s| s.as_str());

                let is_unregistered = value
                    .get("error")
                    .and_then(|e| e.get("details"))
                    .and_then(|d| d.as_array())
                    .map_or(false, |details| {
                        details.iter().any(|detail| {
                            detail.get("errorCode").and_then(|e| e.as_str()) == Some("UNREGISTERED")
                        })
                    });

                let message = value
                    .get("error")
                    .and_then(|e| e.get("message"))
                    .and_then(|m| m.as_str());

                match (code, status, message) {
                    (Some(404), Some("NOT_FOUND"), _) if is_unregistered => {
                        FcmError::StaleDeviceToken(err)
                    }
                    (Some(400), Some("INVALID_ARGUMENT"), Some(msg))
                        if msg.contains(
                            "The registration token is not a valid FCM registration token",
                        ) =>
                    {
                        FcmError::StaleDeviceToken(err)
                    }
                    (Some(403), Some("PERMISSION_DENIED"), Some(msg))
                        if msg.contains("SenderId mismatch") =>
                    {
                        FcmError::StaleDeviceToken(err)
                    }
                    _ => FcmError::GoogleFcm1Error(err),
                }
            }
            _ => FcmError::GoogleFcm1Error(err),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn unrecognized_device_token_err() {
        let err_json = json!({
            "error": {
                "code": 404,
                "message": "Requested entity was not found.",
                "status": "NOT_FOUND",
                "details": [
                    {
                        "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
                        "errorCode": "UNREGISTERED"
                    }
                ]
            }
        });

        let err = google_fcm1::Error::BadRequest(err_json);
        let converted_err: FcmError = err.into();

        assert!(matches!(converted_err, FcmError::StaleDeviceToken(_)));
    }

    #[test]
    fn invalid_device_token_err() {
        let err_json = json!({
            "error": {
                "code": 400,
                "message": "The registration token is not a valid FCM registration token",
                "status": "INVALID_ARGUMENT",
                "details": [
                    {
                        "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
                        "errorCode": "INVALID_ARGUMENT"
                    }
                ]
            }
        });
        let err = google_fcm1::Error::BadRequest(err_json);
        let converted_err: FcmError = err.into();

        assert!(matches!(converted_err, FcmError::StaleDeviceToken(_)));
    }

    #[test]
    fn sender_id_mismatch_err() {
        let err_json = json!({
            "error": {
                "code": 403,
                "message": "SenderId mismatch",
                "status": "PERMISSION_DENIED",
                "details": [
                    {
                        "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
                        "errorCode": "SENDER_ID_MISMATCH"
                    }
                ]
            }
        });
        let err = google_fcm1::Error::BadRequest(err_json);
        let converted_err: FcmError = err.into();

        assert!(matches!(converted_err, FcmError::StaleDeviceToken(_)));
    }
}
