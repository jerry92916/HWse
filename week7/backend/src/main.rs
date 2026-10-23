use axum::{http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, path::PathBuf};
use tower_http::services::ServeDir;

#[derive(Deserialize)]
struct AddRequest {
    a: f64,
    b: f64,
}

#[derive(Deserialize)]
struct CalcRequest {
    a: f64,
    b: f64,
    operation: Operation,
}

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
enum Operation {
    Add,
    Subtract,
    Multiply,
    Divide,
}

#[derive(Debug)]
enum CalcError {
    NumberOverflow,
    DivisionByZero,
}

#[derive(Serialize)]
struct CalcResponse {
    result: f64,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: &'static str,
}

fn calculate_logic(a: f64, b: f64, operation: Operation) -> Result<f64, CalcError> {
    let result = match operation {
        Operation::Add => a + b,
        Operation::Subtract => a - b,
        Operation::Multiply => a * b,
        Operation::Divide if b == 0.0 => return Err(CalcError::DivisionByZero),
        Operation::Divide => a / b,
    };

    if result.is_finite() {
        Ok(result)
    } else {
        Err(CalcError::NumberOverflow)
    }
}

fn calculation_error(error: CalcError) -> (StatusCode, Json<ErrorResponse>) {
    let message = match error {
        CalcError::NumberOverflow => "number overflow",
        CalcError::DivisionByZero => "division by zero",
    };

    (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse { error: message }),
    )
}

async fn calculate_api(
    Json(payload): Json<CalcRequest>,
) -> Result<Json<CalcResponse>, (StatusCode, Json<ErrorResponse>)> {
    calculate_logic(payload.a, payload.b, payload.operation)
        .map(|result| Json(CalcResponse { result }))
        .map_err(calculation_error)
}

async fn add_api(
    Json(payload): Json<AddRequest>,
) -> Result<Json<CalcResponse>, (StatusCode, Json<ErrorResponse>)> {
    calculate_logic(payload.a, payload.b, Operation::Add)
        .map(|result| Json(CalcResponse { result }))
        .map_err(calculation_error)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Router::new()
        .route("/api/add", post(add_api))
        .route("/api/calculate", post(calculate_api))
        .fallback_service(ServeDir::new(
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../frontend"),
        ));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("伺服器啟動於 http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_positive_negative_zero_and_decimal_values() {
        assert_eq!(calculate_logic(2.0, 3.0, Operation::Add).unwrap(), 5.0);
        assert_eq!(calculate_logic(-8.0, -3.0, Operation::Add).unwrap(), -11.0);
        assert_eq!(calculate_logic(-1.0, 1.0, Operation::Add).unwrap(), 0.0);
        assert_eq!(calculate_logic(0.0, 0.0, Operation::Add).unwrap(), 0.0);
        assert!((calculate_logic(0.1, 0.2, Operation::Add).unwrap() - 0.3).abs() < 1e-10);
    }

    #[test]
    fn supports_subtraction() {
        assert_eq!(
            calculate_logic(12.0, 5.0, Operation::Subtract).unwrap(),
            7.0
        );
        assert_eq!(
            calculate_logic(3.0, 8.0, Operation::Subtract).unwrap(),
            -5.0
        );
    }

    #[test]
    fn supports_multiplication() {
        assert_eq!(
            calculate_logic(-4.0, 3.0, Operation::Multiply).unwrap(),
            -12.0
        );
        assert_eq!(calculate_logic(0.0, 9.0, Operation::Multiply).unwrap(), 0.0);
        assert_eq!(
            calculate_logic(1e200, 1e100, Operation::Multiply).unwrap(),
            1e300
        );
    }

    #[test]
    fn supports_decimal_division() {
        assert_eq!(calculate_logic(15.0, 3.0, Operation::Divide).unwrap(), 5.0);
        assert_eq!(calculate_logic(7.0, 2.0, Operation::Divide).unwrap(), 3.5);
        assert_eq!(
            calculate_logic(1.0, 3.0, Operation::Divide).unwrap(),
            1.0 / 3.0
        );
    }

    #[test]
    fn reports_division_by_zero() {
        assert!(matches!(
            calculate_logic(10.0, 0.0, Operation::Divide),
            Err(CalcError::DivisionByZero)
        ));
    }

    #[test]
    fn reports_overflow_when_a_result_is_not_finite() {
        assert!(matches!(
            calculate_logic(f64::MAX, f64::MAX, Operation::Multiply),
            Err(CalcError::NumberOverflow)
        ));
    }

    #[test]
    fn handles_values_larger_than_i32() {
        assert_eq!(
            calculate_logic(2_147_483_648.0, 1.0, Operation::Add).unwrap(),
            2_147_483_649.0
        );
    }
}
