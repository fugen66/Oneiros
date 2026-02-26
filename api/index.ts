// В GET /api/dreams
app.get("/api/dreams", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    let query = supabase.from("dreams").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    // ...
  }
});

// В PATCH /api/dreams/:id
app.patch("/api/dreams/:id", async (req, res) => {
  // ...
  const { analysis, title, image_url } = req.body;
  if (image_url !== undefined) updateData.image_url = image_url;
  // ...
});
