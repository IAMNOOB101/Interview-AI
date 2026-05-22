import { Subscription } from "../db/index.js";
import crypto from "crypto";

const getRazorpay = async () => {
  try {
    const { default: Razorpay } = await import("razorpay");
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch {
    return {
      orders: {
        create: async () => { throw new Error("Razorpay SDK not installed. Run: npm install razorpay"); }
      }
    };
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount) return res.status(400).json({ message: "amount is required" });
    const rz = await getRazorpay();
    const order = await rz.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });
    res.json({ order });
  } catch (err) { next(err); }
};

export const verifyWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const sig    = req.headers["x-razorpay-signature"];
  const digest = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");

  if (sig !== digest) return res.status(400).json({ message: "Invalid signature" });

  if (req.body.event === "payment.captured") {
    const p = req.body.payload?.payment?.entity;
    await Subscription.create({
      userId: null, institutionId: null,
      plan: p?.description || "one-time",
      providerId: p?.id,
      status: "ACTIVE",
      validTill: null,
    }).catch(console.error);
  }

  res.json({ ok: true });
};
