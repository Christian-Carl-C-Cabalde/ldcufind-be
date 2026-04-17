import type { Context } from 'hono';
import { findAllItems, findItemById, createItem, updateItem, deleteItem } from './item.model.js';
import fs from 'fs';
import path from 'path';
import { io } from '../../index.js';

// Helper to map DB columns to what Angular frontend expects
const formatItem = (item: any) => {
    if (!item) return item;
    return { ...item, imageUrl: item.image_url };
};

export const getItems = async (c: Context) => {
    try {
        const items = await findAllItems();
        return c.json(items.map(formatItem), 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch items' }, 500);
    }
};

export const getItem = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const item = await findItemById(id);

        if (!item) {
            return c.json({ message: 'Item not found' }, 404);
        }

        return c.json(formatItem(item), 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch item' }, 500);
    }
};

export const postItem = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, description, location, date, imageUrl, image_url, status } = body;
        
        const finalImageUrl = imageUrl || image_url;

        if (!name || !description || !location || !date) {
            return c.json({ message: 'Name, description, location, and date are required' }, 400);
        }

        const result: any = await createItem({ name, description, location, date, image_url: finalImageUrl, status });
        const newItem = formatItem({ id: result.insertId, name, description, location, date, image_url: finalImageUrl, status: status || 'Available' });

        // Emit real-time event
        io.emit('new_item', newItem);

        return c.json({
            message: 'Item created successfully',
            item: newItem
        }, 201);
    } catch (error) {
        return c.json({ message: 'Failed to create item' }, 500);
    }
};

export const putItem = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const body = await c.req.json();

        const existing = await findItemById(id);
        if (!existing) {
            return c.json({ message: 'Item not found' }, 404);
        }

        const finalImageUrl = body.imageUrl || body.image_url;
        const updateData = { ...body };
        if (finalImageUrl) updateData.image_url = finalImageUrl;

        console.log(`[DEBUG] Updating item ${id} with data:`, updateData);

        await updateItem(id, updateData);
        const updated = await findItemById(id);
        const updatedItem = formatItem(updated);

        // Emit real-time event
        io.emit('item_updated', updatedItem);

        return c.json({ message: 'Item updated successfully', item: updatedItem }, 200);
    } catch (error: any) {
        console.error('Update item error detail:', error);
        return c.json({ message: 'Failed to update item', error: error.message }, 500);
    }
};

export const removeItem = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));

        const existing = await findItemById(id);
        if (!existing) {
            return c.json({ message: 'Item not found' }, 404);
        }

        await deleteItem(id);

        if (existing.image_url && existing.image_url.includes('/uploads/')) {
            const filename = existing.image_url.split('/uploads/').pop();
            const filePath = path.join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        return c.json({ message: 'Item deleted successfully' }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to delete item' }, 500);
    }
};
