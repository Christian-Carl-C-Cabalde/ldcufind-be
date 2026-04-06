import { Hono } from 'hono';
import { getItems, getItem, postItem, putItem, removeItem } from './item.controller.js';

const itemRoutes = new Hono();

itemRoutes.get('/', getItems);           // GET    /api/items
itemRoutes.get('/:id', getItem);         // GET    /api/items/:id
itemRoutes.post('/', postItem);          // POST   /api/items
itemRoutes.put('/:id', putItem);         // PUT    /api/items/:id
itemRoutes.delete('/:id', removeItem);   // DELETE /api/items/:id

export default itemRoutes;
