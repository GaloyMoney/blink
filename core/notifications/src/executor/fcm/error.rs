use thiserror::Error;

#[derive(Debug, Error)]
pub enum FcmError {
    #[error("FcmError - I/O Error: {0}")]
    IOError(#[from] std::io::Error),
    #[error("FcmError - GoogleFcm1Error: {0}")]
    GoogleFcm1Error(google_fcm1::Error),
    #[error("FcmError: UnrecognizedDeviceToken: {0}")]
    UnrecognizedDeviceToken(google_fcm1::Error),
}

impl From<google_fcm1::Error> for FcmError {
    fn from(err: google_fcm1::Error) -> Self {
        match err {
            google_fcm1::Error::BadRequest(ref value) => {
                if value["error"]["code"].as_u64() == Some(404)
                    && value["error"]["status"].as_str() == Some("NOT_FOUND")
                    && value["error"]["details"]
                        .as_array()
                        .map_or(false, |details| {
                            details
                                .iter()
                                .any(|detail| detail["errorCode"].as_str() == Some("UNREGISTERED"))
                        })
                {
                    return FcmError::UnrecognizedDeviceToken(err);
                }
                FcmError::GoogleFcm1Error(err)
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

        assert!(matches!(
            converted_err,
            FcmError::UnrecognizedDeviceToken(_)
        ));
    }
}
