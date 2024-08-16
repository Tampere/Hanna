UPDATE
    app.USER
SET
    permissions = array_remove(permissions, 'financials.write');