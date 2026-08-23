const test = require("node:test");
const assert = require("node:assert/strict");

const { buildTaskFilters } = require("../../dist/src/modules/tasks/task.service.js");

test("buildTaskFilters combines status, priority, date, and assignee constraints", () => {
    const filters = buildTaskFilters({
        status: "todo",
        priority: "high",
        assignedTo: "11111111-1111-4111-8111-111111111111",
        dueDateFrom: "2026-08-01T00:00:00.000Z",
        dueDateTo: "2026-08-31T23:59:59.999Z",
    });

    assert.deepEqual(filters, {
        AND: [
            { status: "todo" },
            { priority: "high" },
            {
                assignments: {
                    some: {
                        userId: "11111111-1111-4111-8111-111111111111",
                    },
                },
            },
            {
                dueDate: {
                    gte: new Date("2026-08-01T00:00:00.000Z"),
                },
            },
            {
                dueDate: {
                    lte: new Date("2026-08-31T23:59:59.999Z"),
                },
            },
        ],
    });
});