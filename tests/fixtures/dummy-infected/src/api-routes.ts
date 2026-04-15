// @ts-nocheck
/**
 * FIXTURE FILE — Deliberately vulnerable API routes.
 * Demonstrates: SQL Injection, IDOR, Broken Authentication.
 * DO NOT USE IN PRODUCTION.
 */

import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── VULNERABILITY 1: SQL injection via template literal ───────────────────────

export async function searchListings(req: any, res: any) {
  const { query } = req.body;

  // INSECURE: user input interpolated directly into SQL string
  const { data, error } = await supabase.rpc(`
    SELECT * FROM listings
    WHERE title ILIKE '%${query}%'
    ORDER BY created_at DESC
  `);

  return res.json(data);
}

// ── VULNERABILITY 2: SQL injection via string concatenation ──────────────────

export async function getUsersByRole(req: any, res: any) {
  const { role } = req.body;

  // INSECURE: role concatenated into WHERE clause
  const query = "SELECT * FROM profiles WHERE role = '" + role + "' AND active = true";

  const { data } = await supabase.rpc("execute_raw_sql", { sql: query });
  return res.json(data);
}

// ── VULNERABILITY 3: IDOR — fetching resource by user-supplied ID ─────────────

export async function getListing(req: any, res: any) {
  // INSECURE: fetches listing by ID from URL without checking ownership
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  // Missing check: if (data.user_id !== session.user.id) return res.status(403)
  return res.json(data);
}

// ── VULNERABILITY 4: IDOR — reading file by user-provided path ────────────────

import path from "path";
import fs from "fs";

export function readUserFile(req: any, res: any) {
  const { filename } = req.body;

  // INSECURE: path traversal — attacker can pass "../../etc/passwd"
  const filePath = path.join("/uploads", req.body.filename);
  const content = fs.readFileSync(filePath, "utf-8");

  return res.json({ content });
}

// ── VULNERABILITY 5: JWT decoded without verification ─────────────────────────

export async function getUserProfile(req: any, res: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  // INSECURE: jwt.decode() does NOT verify the signature
  // Any base64-encoded payload will be accepted as valid
  const payload = jwt.decode(token);

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", payload.sub)
    .single();

  return res.json(data);
}

// ── VULNERABILITY 6: Hardcoded JWT secret ─────────────────────────────────────

export function generateToken(userId: string) {
  // INSECURE: hardcoded JWT secret — anyone with repo access can forge tokens
  return jwt.sign({ sub: userId }, "my-super-secret-jwt-key-12345", {
    expiresIn: "7d",
  });
}

// ── VULNERABILITY 7: Missing auth guard on protected route ────────────────────

export async function DELETE(request: Request) {
  // INSECURE: no session check — any unauthenticated request can delete listings
  const { id } = await request.json();

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id);

  return Response.json({ success: !error });
}

// ── VULNERABILITY 8: Password stored without hashing ─────────────────────────

export async function createUser(req: any, res: any) {
  const { email, password } = req.body;

  // INSECURE: password stored in plaintext — no bcrypt or argon2
  await supabase.from("users").insert({
    email,
    password,   // plaintext — catastrophic on breach
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true });
}

// ── VULNERABILITY 9: CORS wildcard with credentials ───────────────────────────

import cors from "cors";

const corsOptions = {
  origin: "*",
  credentials: true,  // INSECURE: wildcard origin + credentials is blocked by browsers
  methods: ["GET", "POST", "PUT", "DELETE"],
};
