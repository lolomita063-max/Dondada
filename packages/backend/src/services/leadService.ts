import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/database.js';

export interface LeadData {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  painPoints?: string;
  budgetRange?: string;
  timeline?: string;
}

export interface Conversation {
  id: string;
  sessionId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  qualified: number;
  intent: string | null;
  createdAt: string;
}

export function createConversation(sessionId: string, source = 'widget'): Conversation {
  const db = getDb();
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO conversations (id, session_id, source)
    VALUES (?, ?, ?)
  `).run(id, sessionId, source);

  return getConversation(id)!;
}

export function getConversation(id: string): Conversation | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  if (!row) return null;
  return mapConversation(row);
}

export function getConversationBySession(sessionId: string): Conversation | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1').get(sessionId) as any;
  if (!row) return null;
  return mapConversation(row);
}

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    sessionId: row.session_id,
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email,
    qualified: row.qualified,
    intent: row.intent,
    createdAt: row.created_at,
  };
}

export function updateConversation(id: string, data: Partial<LeadData>): void {
  const db = getDb();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { updates.push('visitor_name = ?'); params.push(data.name); }
  if (data.email !== undefined) { updates.push('visitor_email = ?'); params.push(data.email); }
  if (data.company !== undefined) { updates.push('visitor_company = ?'); params.push(data.company); }
  if (data.painPoints !== undefined) { updates.push('pain_points = ?'); params.push(data.painPoints); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
}

export function qualifyConversation(id: string, intent: string): void {
  const db = getDb();
  db.prepare("UPDATE conversations SET qualified = 1, intent = ?, updated_at = datetime('now') WHERE id = ?").run(intent, id);
}

export function createLead(conversationId: string, data: LeadData): string {
  const db = getDb();
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO leads (id, conversation_id, name, email, company, phone, pain_points, budget_range, timeline, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, conversationId, data.name || null, data.email || null, data.company || null, 
         data.phone || null, data.painPoints || null, data.budgetRange || null, data.timeline || null,
         calculateScore(data));

  return id;
}

export function getLeadByConversation(conversationId: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM leads WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conversationId);
}

export function updateLeadStatus(leadId: string, status: string): void {
  const db = getDb();
  db.prepare("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, leadId);
}

export function createAppointment(leadId: string, scheduledAt: string, durationMinutes = 30): string {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO appointments (id, lead_id, scheduled_at, duration_minutes)
    VALUES (?, ?, ?, ?)
  `).run(id, leadId, scheduledAt, durationMinutes);
  return id;
}

function calculateScore(data: LeadData): number {
  let score = 0;
  if (data.name) score += 10;
  if (data.email) score += 20;
  if (data.company) score += 15;
  if (data.phone) score += 10;
  if (data.painPoints) score += 15;
  if (data.budgetRange) score += 15;
  if (data.timeline) score += 15;
  return score;
}

export function trackAnalytics(eventType: string, sessionId: string, metadata?: Record<string, any>): void {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO analytics (id, event_type, session_id, metadata)
    VALUES (?, ?, ?, ?)
  `).run(id, eventType, sessionId, metadata ? JSON.stringify(metadata) : null);
}

export function getAnalyticsSummary(): any {
  const db = getDb();
  
  const totalConversations = (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any).count;
  const qualifiedLeads = (db.prepare('SELECT COUNT(*) as count FROM conversations WHERE qualified = 1').get() as any).count;
  const totalLeads = (db.prepare('SELECT COUNT(*) as count FROM leads').get() as any).count;
  const bookedAppointments = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status IN ('confirmed', 'completed')").get() as any).count;
  const leadsToday = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')").get() as any).count;

  return {
    totalConversations,
    qualifiedLeads,
    totalLeads,
    bookedAppointments,
    leadsToday,
    conversionRate: totalConversations > 0 ? ((qualifiedLeads / totalConversations) * 100).toFixed(1) + '%' : '0%',
  };
}
