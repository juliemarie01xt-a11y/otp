CREATE OR REPLACE FUNCTION deduct_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT balance INTO current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    new_balance := current_balance - p_amount;

    UPDATE profiles
    SET balance = new_balance
    WHERE id = p_user_id;

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refund_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
BEGIN
    -- Lock the row for update
    SELECT balance INTO current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    new_balance := current_balance + p_amount;

    UPDATE profiles
    SET balance = new_balance
    WHERE id = p_user_id;

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
