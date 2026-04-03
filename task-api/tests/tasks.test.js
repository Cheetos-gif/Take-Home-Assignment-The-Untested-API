const request = require("supertest");
const app = require("../src/app");
const taskService = require("../src/services/taskService");

beforeEach(() => {
  taskService._reset();
});

// taskService unit tests
describe('taskService', () => {

  describe('create', () => {
    test('creates a task with correct fields', () => {
      const task = taskService.create({ title: 'Test task' });
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    test('uses provided status and priority', () => {
      const task = taskService.create({ title: 'Test', status: 'in_progress', priority: 'high' });
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
    });
  });

  describe('getAll', () => {
    test('returns empty array when no tasks', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    test('returns all created tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      expect(taskService.getAll()).toHaveLength(2);
    });
  });

  describe('findById', () => {
    test('returns task if found', () => {
      const task = taskService.create({ title: 'Find me' });
      expect(taskService.findById(task.id)).toEqual(task);
    });

    test('returns undefined if not found', () => {
      expect(taskService.findById('fake-id')).toBeUndefined();
    });
  });

  describe("getByStatus", () => {
    test("returns only tasks with matching status", () => {
      taskService.create({ title: "Task 1", status: "todo" });
      taskService.create({ title: "Task 2", status: "done" });
      const result = taskService.getByStatus("todo");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Task 1");
    });

    test("does not return partial status matches", () => {
      taskService.create({ title: "Task 1", status: "todo" });
      taskService.create({ title: "Task 2", status: "done" });
      const result = taskService.getByStatus("do");
      expect(result).toHaveLength(0);
    });
  });

  describe("getPaginated", () => {
    test("page 1 returns first set of tasks", () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }
      const result = taskService.getPaginated(1, 3);
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("Task 1");
    });

    test("page 2 returns next set", () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }
      const result = taskService.getPaginated(2, 3);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Task 4");
    });
  });

  describe("completeTask", () => {
    test("sets status to done and completedAt", () => {
      const task = taskService.create({ title: "Finish me" });
      const result = taskService.completeTask(task.id);
      expect(result.status).toBe("done");
      expect(result.completedAt).toBeDefined();
    });

    test("preserves original priority", () => {
      const task = taskService.create({
        title: "High priority",
        priority: "high",
      });
      const result = taskService.completeTask(task.id);
      expect(result.priority).toBe("high");
    });

    test("returns null for non-existent task", () => {
      expect(taskService.completeTask("fake-id")).toBeNull();
    });
  });

});


// Route integration tests
describe('POST /tasks', () => {
  test('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 if title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ priority: 'high' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 if title is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if status is invalid', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('GET /tasks', () => {
  test('returns empty array when no tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });
    await request(app).post('/tasks').send({ title: 'Task 2' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters by status', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'Task 2', status: 'in_progress' });
    const res = await request(app).get('/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Task 1');
  });

  test('paginates correctly', async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }
    const res = await request(app).get('/tasks?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].title).toBe('Task 1');
  });
});

describe('PUT /tasks/:id', () => {
  test('updates a task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Old title' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'New title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/tasks/fake-id')
      .send({ title: 'Anything' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes a task and returns 204', async () => {
    const created = await request(app).post('/tasks').send({ title: 'To delete' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/tasks/fake-id');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /tasks/:id/complete', () => {
  test('marks task as done', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Finish me' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toBeDefined();
  });

  test('preserves priority when completing', async () => {
    const created = await request(app).post('/tasks').send({ title: 'High', priority: 'high' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.body.priority).toBe('high');
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app).patch('/tasks/fake-id/complete');
    expect(res.status).toBe(404);
  });
});

describe('GET /tasks/stats', () => {
  test('returns correct counts', async () => {
    await request(app).post('/tasks').send({ title: 'T1', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'T2', status: 'in_progress' });
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.in_progress).toBe(1);
    expect(res.body.done).toBe(0);
  });

  test('counts overdue tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Overdue', dueDate: '2020-01-01T00:00:00.000Z' });
    const res = await request(app).get('/tasks/stats');
    expect(res.body.overdue).toBe(1);
  });
});

describe("PUT /tasks/:id validation", () => {
  test("returns 400 if title is empty string", async () => {
    const created = await request(app).post("/tasks").send({ title: "Valid" });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  test("returns 400 if status is invalid", async () => {
    const created = await request(app).post("/tasks").send({ title: "Valid" });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ status: "invalid" });
    expect(res.status).toBe(400);
  });

  test("returns 400 if priority is invalid", async () => {
    const created = await request(app).post("/tasks").send({ title: "Valid" });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ priority: "urgent" });
    expect(res.status).toBe(400);
  });

  test("returns 400 if dueDate is invalid", async () => {
    const created = await request(app).post("/tasks").send({ title: "Valid" });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ dueDate: "not-a-date" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /tasks/:id/assign", () => {
  test("assigns a task to a user", async () => {
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Task to assign" });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: "John" });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe("John");
  });

  test("returns 404 if task does not exist", async () => {
    const res = await request(app)
      .patch("/tasks/fake-id/assign")
      .send({ assignee: "John" });
    expect(res.status).toBe(404);
  });

  test("returns 400 if assignee is missing", async () => {
    const created = await request(app).post("/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({});
    expect(res.status).toBe(400);
  });

  test("returns 400 if assignee is empty string", async () => {
    const created = await request(app).post("/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: "" });
    expect(res.status).toBe(400);
  });

  test("can reassign a task to a different user", async () => {
    const created = await request(app).post("/tasks").send({ title: "Task" });
    await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: "John" });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: "Jane" });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe("Jane");
  });
});