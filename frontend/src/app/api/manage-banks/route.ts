import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const getAuthHeaders = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const API_URL = process.env.API_URL;

// GET ALL BANKS
export async function GET() {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/manage-banks/`, {
            method: "GET",
            headers,
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("GET Banks error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// CREATE BANK
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/manage-banks/`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("POST Bank error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// UPDATE BANK
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/manage-banks/`, {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("PUT Bank error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE BANK
export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/manage-banks/`, {
            method: "DELETE",
            headers,
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("DELETE Bank error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
