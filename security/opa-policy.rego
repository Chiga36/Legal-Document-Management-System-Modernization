package legal_dms.security

default allow = false

# Allow read access to legal documents if the user has the role 'reader'
allow {
    input.action == "read"
    input.resource == "legal_document"
    input.user.role == "reader"
}

# Allow write access to legal documents if the user has the role 'editor'
allow {
    input.action == "write"
    input.resource == "legal_document"
    input.user.role == "editor"
}

# Deny access to all other actions
allow {
    false
}
