import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import fs from "fs/promises";
import { sendSimpleWhatsAppMessage } from "./src/services/whatsappService.js";

// Initialize Firebase Admin gracefully
let db: admin.firestore.Firestore | null = null;
try {
  if (!admin.apps.length) {
    // Try to initialize. This may fail if credentials aren't set up.
    admin.initializeApp();
  }
  db = admin.firestore();
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize. Server will continue but some features may be disabled.", error);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const localAppointmentsPath = path.join(__dirname, ".data", "local-appointments.json");

  app.use(express.json());

  const readLocalAppointments = async () => {
    try {
      const data = await fs.readFile(localAppointmentsPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const saveLocalAppointment = async (appointment: any) => {
    const appointments = await readLocalAppointments();
    const next = [
      appointment,
      ...appointments.filter((item: any) => item.id !== appointment.id),
    ].slice(0, 100);

    await fs.mkdir(path.dirname(localAppointmentsPath), { recursive: true });
    await fs.writeFile(localAppointmentsPath, JSON.stringify(next, null, 2), "utf-8");
    return appointment;
  };

  // Listen for Appointment changes to send Notifications (only if db is ready)
  if (db) {
    try {
      db.collection('appointments').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async (change) => {
          const data = change.doc.data();
          const id = change.doc.id;

          if (change.type === 'added') {
            console.log(`[WHATSAPP] New Booking Request: ${id}`);
            // Logic to notify Owner about new request
            await sendSimpleWhatsAppMessage({
              to: 'OWNER_PHONE', // In real app, fetch from shop settings
              message: `New Booking Request from ${data.notes || 'Guest'} for ${data.serviceName || 'Service'} on ${data.date} at ${data.time}. Manage it at: https://barberflow.app/owner`
            }).catch(err => console.error("WhatsApp error:", err));
          }

          if (change.type === 'modified') {
            const before = change.doc.data(); // This is wrong in onSnapshot, typically we'd compare with internal state
            // But for status change, we can just check data.status
            console.log(`[NOTIFICATION] Booking ${id} status: ${data.status}`);
            
            if (data.status === 'confirmed') {
              console.log(`[WHATSAPP] Confirmed: ${id}`);
              await sendSimpleWhatsAppMessage({
                to: 'CUSTOMER_PHONE', // In real app, fetch from customer profile
                message: `✅ Your booking at BarberFlow is CONFIRMED!\n\nService: ${data.serviceName}\nDate: ${data.date}\nTime: ${data.time}\n\nSee you soon!`
              }).catch(err => console.error("WhatsApp error:", err));
            }

            if (data.status === 'rejected') {
              console.log(`[WHATSAPP] Rejected: ${id}`);
              await sendSimpleWhatsAppMessage({
                to: 'CUSTOMER_PHONE',
                message: `❌ Sorry, your booking request for ${data.serviceName} on ${data.date} at ${data.time} could not be accepted. Please try another slot.`
              }).catch(err => console.error("WhatsApp error:", err));
            }
          }
        });
      }, (error) => {
        console.error("Firestore onSnapshot error:", error);
      });
    } catch (e) {
      console.error("Failed to setup Firestore listener:", e);
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/local-appointments", async (req, res) => {
    res.json(await readLocalAppointments());
  });

  app.post("/api/local-appointments", async (req, res) => {
    if (!req.body?.id) {
      res.status(400).json({ error: "Appointment id is required" });
      return;
    }

    const saved = await saveLocalAppointment(req.body);
    res.json(saved);
  });

  app.patch("/api/local-appointments/:id", async (req, res) => {
    const appointments = await readLocalAppointments();
    const existing = appointments.find((item: any) => item.id === req.params.id);
    const updated = {
      ...(existing || { id: req.params.id }),
      ...req.body,
      updatedAt: Date.now(),
    };

    const next = [
      updated,
      ...appointments.filter((item: any) => item.id !== req.params.id),
    ].slice(0, 100);

    await fs.mkdir(path.dirname(localAppointmentsPath), { recursive: true });
    await fs.writeFile(localAppointmentsPath, JSON.stringify(next, null, 2), "utf-8");
    res.json(updated);
  });

  // ImageKit Authentication Endpoint (for client-side uploads)
  app.get("/api/imagekit/auth", (req, res) => {
    // Implement ImageKit auth logic here if needed
    res.json({ token: "dummy_token" }); 
  });

  // WhatsApp Webhooks
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  app.post("/api/whatsapp/webhook", (req, res) => {
    console.log("WhatsApp Webhook received:", JSON.stringify(req.body, null, 2));
    // Handle incoming messages (e.g. "YES" to confirm opt-in)
    res.status(200).send("EVENT_RECEIVED");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Serve index.html for all other routes (SPA fallback)
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.readFile(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BarberFlow server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
