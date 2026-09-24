// AL_VER PocketBase hooks (PocketBase v0.40.x JSVM API).
//
// Security goals:
//  1. Public sign-up can never self-assign a privileged role (always forced to "user").
//  2. On authenticated listing creation, "owner" is forced to the authenticated user
//     and "status" is forced to "pending" (clients cannot spoof either field).

onRecordCreateRequest((e) => {
  if (e.collection.name === "users") {
    // Force-safe default role for self-registration.
    const role = e.record.getString("role");
    if (role !== "user") e.record.set("role", "user");
  }

  if (e.collection.name === "listings") {
    if (!e.auth || !e.auth.id) {
      throw new BadRequestError("ثبت آگهی نیازمند ورود است.");
    }
    // Force listing ownership and initial status on the server.
    e.record.set("owner", e.auth.id);
    e.record.set("status", "pending");
    e.record.set("publicPhone", ""); // moderation metadata set only by staff
  }

  e.next();
}, "users", "listings");

onRecordUpdateRequest((e) => {
  if (e.collection.name === "listings") {
    const role = e.auth ? e.auth.getString("role") : "";
    const isStaff = role === "main" || role === "admin";
    if (!isStaff) {
      if (e.record.getString("status") !== e.record.original().getString("status")) {
        throw new ForbiddenError("تغییر وضعیت آگهی فقط توسط مدیریت مجاز است.");
      }
      if (e.record.getString("owner") !== e.record.original().getString("owner")) {
        e.record.set("owner", e.record.original().getString("owner"));
      }
    }
  }

  // Nobody may self-escalate their role via profile update.
  if (e.collection.name === "users") {
    const role = e.auth ? e.auth.getString("role") : "";
    const isMain = role === "main";
    if (!isMain && e.record.getString("role") !== e.record.original().getString("role")) {
      e.record.set("role", e.record.original().getString("role"));
    }
  }

  e.next();
}, "users", "listings");
