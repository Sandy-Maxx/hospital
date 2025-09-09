const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function cleanupSessions() {
  try {
    console.log("Starting session cleanup...");

    // Load hospital settings
    const settingsPath = path.join(
      __dirname,
      "..",
      "data",
      "hospital-settings.json",
    );
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const activeTemplates = settingsData.sessionTemplates.filter(
      (template) => template.isActive,
    );

    console.log("Active session templates:", activeTemplates.length);

    // Get all existing sessions
    const existingSessions = await prisma.appointmentSession.findMany();
    console.log("Existing sessions in database:", existingSessions.length);

    // Delete sessions that don't match current templates
    const validShortCodes = activeTemplates.map((t) => t.shortCode);
    const sessionsToDelete = existingSessions.filter(
      (session) => !validShortCodes.includes(session.shortCode),
    );

    if (sessionsToDelete.length > 0) {
      console.log("Deleting invalid sessions:", sessionsToDelete.length);
      await prisma.appointmentSession.deleteMany({
        where: {
          id: {
            in: sessionsToDelete.map((s) => s.id),
          },
        },
      });
    }

    // Update existing valid sessions with correct maxTokens
    for (const template of activeTemplates) {
      await prisma.appointmentSession.updateMany({
        where: {
          shortCode: template.shortCode,
        },
        data: {
          name: template.name,
          startTime: template.startTime,
          endTime: template.endTime,
          maxTokens: template.maxTokens,
          isActive: template.isActive,
        },
      });
    }

    console.log("Session cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSessions();
