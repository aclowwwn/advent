const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- PROJECTS ---

app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { id, name, color } = req.body;
    const project = await prisma.project.create({
      data: { id, name, color }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- tasks ---

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        checklist: true,
        contentIdeas: true
      }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const { id, projectId, title, date, startTime, endTime, description, checklist, contentIdeas, completed } = req.body;
    
    const task = await prisma.task.create({
      data: {
        id,
        projectId,
        title,
        date,
        startTime,
        endTime,
        description: description || '',
        completed: completed || false,
        checklist: {
          create: checklist?.map(item => ({
             id: item.id,
             text: item.text,
             completed: item.completed
          })) || []
        },
        contentIdeas: {
          create: contentIdeas?.map(idea => ({
            id: idea.id,
            type: idea.type,
            text: idea.text
          })) || []
        }
      },
      include: { checklist: true, contentIdeas: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const { projectId, title, date, startTime, endTime, description, checklist, contentIdeas, completed } = req.body;
    const taskId = req.params.id;

    // Transaction to update task and replace nested items
    const result = await prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.task.update({
        where: { id: taskId },
        data: { projectId, title, date, startTime, endTime, description, completed }
      });

      // Update Checklist (Delete all and recreate - simplest strategy for this scale)
      await tx.checklistItem.deleteMany({ where: { taskId } });
      if (checklist && checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: checklist.map(c => ({
            id: c.id,
            taskId,
            text: c.text,
            completed: c.completed
          }))
        });
      }

      // Update Content Ideas
      await tx.contentIdea.deleteMany({ where: { taskId } });
      if (contentIdeas && contentIdeas.length > 0) {
        await tx.contentIdea.createMany({
          data: contentIdeas.map(c => ({
            id: c.id,
            taskId,
            type: c.type,
            text: c.text
          }))
        });
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: { checklist: true, contentIdeas: true }
      });
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.use(express.static("dist"));
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
