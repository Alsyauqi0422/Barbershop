const GAS_URL = process.env.GAS_URL;

export default async function handler(req, res) {
  if (!GAS_URL) {
    return res.status(500).json({
      success: false,
      message: "Environment variable GAS_URL belum diatur di Vercel."
    });
  }

  try {
    if (req.method === "GET") {
      const incoming = new URL(req.url, `https://${req.headers.host || "localhost"}`);
      const target = new URL(GAS_URL);

      for (const [key, value] of incoming.searchParams.entries()) {
        target.searchParams.set(key, value);
      }

      const response = await fetch(target.toString(), {
        method: "GET",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({
          success: false,
          message: "Google Apps Script mengirim respons yang bukan JSON."
        });
      }

      return res.status(response.ok ? 200 : 502).json(data);
    }

    if (req.method === "POST") {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const form = new URLSearchParams();
      form.set("data", JSON.stringify(payload));

      const response = await fetch(GAS_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Accept": "application/json"
        },
        body: form.toString()
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({
          success: false,
          message: "Google Apps Script mengirim respons yang bukan JSON."
        });
      }

      return res.status(response.ok && data.success !== false ? 200 : 409).json(data);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      success: false,
      message: "Method tidak didukung."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "API Vercel gagal menghubungi Google Apps Script.",
      error: error.message
    });
  }
}
