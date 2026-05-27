-- Creación de la secuencia para la numeración de facturas
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
    START WITH 1
    INCREMENT BY 1;
