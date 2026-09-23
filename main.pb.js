// AL_VER PocketBase production hooks.
// Management bootstrap is intentionally environment-driven; no admin phone/password is hard-coded.

onRecordBeforeCreateRequest((e) => {
  if (e.collection.name !== "listings") return;
  e.record.set("status", "pending");
}, "listings");

onRecordBeforeUpdateRequest((e) => {
  if (e.collection.name !== "listings") return;
  const status = e.record.getString("status");
  if (!status) e.record.set("status", "pending");
}, "listings");
