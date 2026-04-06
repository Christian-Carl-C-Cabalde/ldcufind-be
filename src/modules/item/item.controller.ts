import type { Context } from 'hono';
import { findAllItems, findItemById, createItem, updateItem, deleteItem } from './item.model.js';

export const getItems = async (c: Context) => {
    try {
        const items = await findAllItems();
        return c.json(items, 200);
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

        return c.json(item, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch item' }, 500);
    }
};

export const postItem = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, description, location, date, image_url, status } = body;

        if (!name || !description || !location || !date) {
            return c.json({ message: 'Name, description, location, and date are required' }, 400);
        }

        const result: any = await createItem({ name, description, location, date, image_url, status });

        return c.json({
            message: 'Item created successfully',
            item: { id: result.insertId, name, description, location, date, image_url, status: status || 'Available' }
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

        await updateItem(id, body);
        const updated = await findItemById(id);

        return c.json({ message: 'Item updated successfully', item: updated }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to update item' }, 500);
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
        return c.json({ message: 'Item deleted successfully' }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to delete item' }, 500);
    }
};
