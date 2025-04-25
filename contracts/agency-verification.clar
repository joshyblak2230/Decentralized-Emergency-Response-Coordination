;; Agency Verification Contract
;; This contract validates legitimate emergency response organizations

(define-data-var admin principal tx-sender)

;; Map to store verified agencies
(define-map verified-agencies principal
  {
    name: (string-utf8 100),
    verification-date: uint,
    agency-type: (string-utf8 50),
    is-active: bool
  }
)

;; Public function to verify a new agency (admin only)
(define-public (verify-agency (agency principal) (name (string-utf8 100)) (agency-type (string-utf8 50)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1)) ;; Only admin can verify
    (asserts! (is-none (map-get? verified-agencies agency)) (err u2)) ;; Agency not already verified

    (map-set verified-agencies agency
      {
        name: name,
        verification-date: block-height,
        agency-type: agency-type,
        is-active: true
      }
    )
    (ok true)
  )
)

;; Public function to deactivate an agency (admin only)
(define-public (deactivate-agency (agency principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1)) ;; Only admin can deactivate
    (asserts! (is-some (map-get? verified-agencies agency)) (err u3)) ;; Agency must exist

    (match (map-get? verified-agencies agency)
      agency-data (begin
        (map-set verified-agencies agency
          (merge agency-data { is-active: false })
        )
        (ok true)
      )
      (err u3)
    )
  )
)

;; Public function to check if an agency is verified
(define-read-only (is-verified (agency principal))
  (match (map-get? verified-agencies agency)
    agency-data (get is-active agency-data)
    false
  )
)

;; Public function to get agency details
(define-read-only (get-agency-details (agency principal))
  (map-get? verified-agencies agency)
)

;; Function to transfer admin rights (admin only)
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (var-set admin new-admin)
    (ok true)
  )
)
