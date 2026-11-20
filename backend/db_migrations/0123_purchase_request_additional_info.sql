-- Lisätietoja: free text sent in the purchase request email
ALTER TABLE app.purchase_request ADD COLUMN additional_info TEXT;
