import db from '../../config/db.js';

export const findAllClaims = async (status?: string) => {
    if (status && status !== 'all') {
        const [rows] = await db.query(
            'SELECT c.*, i.name as item_name, i.image_url as item_image_url FROM claims c LEFT JOIN items i ON c.item_id = i.id WHERE c.status = ? ORDER BY c.created_at DESC',
            [status]
        );
        return rows;
    }
    const [rows] = await db.query(
        'SELECT c.*, i.name as item_name, i.image_url as item_image_url FROM claims c LEFT JOIN items i ON c.item_id = i.id ORDER BY c.created_at DESC'
    );
    return rows;
};

export const findClaimById = async (id: number) => {
    const [rows]: any = await db.query(
        'SELECT c.*, i.name as item_name, i.image_url as item_image_url FROM claims c LEFT JOIN items i ON c.item_id = i.id WHERE c.id = ?',
        [id]
    );
    return rows[0];
};

export const findClaimsByItemId = async (itemId: number) => {
    const [rows] = await db.query(
        'SELECT * FROM claims WHERE item_id = ? ORDER BY created_at DESC',
        [itemId]
    );
    return rows;
};

export const createClaim = async (data: {
    item_id: number;
    claimant_name: string;
    claimant_email: string;
    proof_text?: string;
    evidence_image_url?: string;
}) => {
    const [result] = await db.query(
        'INSERT INTO claims (item_id, claimant_name, claimant_email, proof_text, evidence_image_url) VALUES (?, ?, ?, ?, ?)',
        [data.item_id, data.claimant_name, data.claimant_email, data.proof_text || null, data.evidence_image_url || null]
    );
    return result;
};

export const updateClaimStatus = async (id: number, status: 'pending' | 'verified' | 'rejected') => {
    const [result] = await db.query(
        'UPDATE claims SET status = ? WHERE id = ?',
        [status, id]
    );
    return result;
};

export const updateClaim = async (id: number, data: {
    proof_text?: string;
    claimant_name?: string;
    claimant_email?: string;
}) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.proof_text !== undefined) { fields.push('proof_text = ?'); values.push(data.proof_text); }
    if (data.claimant_name !== undefined) { fields.push('claimant_name = ?'); values.push(data.claimant_name); }
    if (data.claimant_email !== undefined) { fields.push('claimant_email = ?'); values.push(data.claimant_email); }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
        `UPDATE claims SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result;
};

export const removeClaim = async (id: number) => {
    const [result] = await db.query(
        'DELETE FROM claims WHERE id = ?',
        [id]
    );
    return result;
};
