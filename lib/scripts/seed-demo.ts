import { ProjectEventType, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const users = [
  ["seed-user-01", "maya-chen", "Maya Chen", "3D artist exploring soft industrial design."],
  ["seed-user-02", "omar-haddad", "Omar Haddad", "Motion designer and occasional sound tinkerer."],
  ["seed-user-03", "sofia-rossi", "Sofia Rossi", "Illustrator building bright, thoughtful worlds."],
  ["seed-user-04", "noah-williams", "Noah Williams", "Product designer focused on useful details."],
  ["seed-user-05", "lina-benali", "Lina Benali", "Photographer, traveler, and visual storyteller."],
  ["seed-user-06", "ethan-kim", "Ethan Kim", "Creative coder making playful experiments."],
  ["seed-user-07", "ines-martin", "Ines Martin", "Editorial designer and typography enthusiast."],
  ["seed-user-08", "kai-nakamura", "Kai Nakamura", "Ambient producer and field-recording collector."],
  ["seed-user-09", "zara-patel", "Zara Patel", "UX researcher who loves collaborative critique."],
  ["seed-user-10", "lucas-moreau", "Lucas Moreau", "Architectural visualizer and material nerd."],
  ["seed-user-11", "amelia-jones", "Amelia Jones", "Brand designer working with independent makers."],
  ["seed-user-12", "youssef-trabelsi", "Youssef Trabelsi", "Frontend developer and generative art fan."],
] as const;

const categories = [
  ["3D", "3D"],
  ["Image", "Image"],
  ["Audio", "Audio"],
  ["PDF", "PDF"],
] as const;

const tags = [
  ["blender", "Blender"],
  ["minimal", "Minimal"],
  ["experimental", "Experimental"],
  ["typography", "Typography"],
  ["ambient", "Ambient"],
  ["architecture", "Architecture"],
  ["branding", "Branding"],
  ["generative", "Generative"],
  ["photography", "Photography"],
  ["ui-design", "UI Design"],
] as const;

const projects = [
  ["seed-project-01", 0, "3D", "Soft Circuit", "A friendly modular environment built from rounded forms.", ["blender", "minimal"]],
  ["seed-project-02", 1, "3D", "Desert Observatory", "A small observatory concept with warm materials and bold silhouettes.", ["architecture", "experimental"]],
  ["seed-project-03", 2, "Image", "Sunday Market", "A colorful study of light, paper, and neighborhood rituals.", ["photography", "minimal"]],
  ["seed-project-04", 3, "Image", "Wayfinding Studies", "A collection of clear visual systems for busy public spaces.", ["ui-design", "typography"]],
  ["seed-project-05", 4, "Image", "Between Stations", "A quiet photographic series about waiting and movement.", ["photography", "experimental"]],
  ["seed-project-06", 5, "Image", "Generative Garden", "A living poster system generated from simple rules.", ["generative", "experimental"]],
  ["seed-project-07", 6, "PDF", "Field Notes on Color", "A practical mini-zine about building useful color palettes.", ["minimal", "typography"]],
  ["seed-project-08", 7, "Audio", "Rain on Glass", "A twelve-minute ambient field recording from a rainy afternoon.", ["ambient", "experimental"]],
  ["seed-project-09", 8, "PDF", "Design Critique Checklist", "A concise worksheet for kinder, more actionable feedback.", ["ui-design", "typography"]],
  ["seed-project-10", 9, "3D", "Courtyard House", "An architectural study in shade, plants, and compact living.", ["architecture", "blender"]],
  ["seed-project-11", 10, "Image", "Maker's Mark", "A flexible identity system for a small ceramics studio.", ["branding", "minimal"]],
  ["seed-project-12", 11, "Audio", "Night Bus Sketches", "Short sketches made from city sounds and granular synthesis.", ["ambient", "generative"]],
] as const;

const forumTopics = [
  ["seed-topic-01", 0, "What are you building this month?", "Share a work in progress, a rough idea, or a creative problem you are trying to solve."],
  ["seed-topic-02", 1, "Best tools for small creative teams", "Which tools help your team move from idea to finished work without adding friction?"],
  ["seed-topic-03", 2, "How do you give useful critique?", "Let us collect practical habits for making feedback specific, kind, and actionable."],
  ["seed-topic-04", 3, "Show us your workspace", "A desk, a sketchbook, a favorite plugin, or anything else that helps you make things."],
  ["seed-topic-05", 4, "Creative references and inspiration", "What books, artists, places, or everyday details have influenced your recent work?"],
  ["seed-topic-06", 5, "From experiment to finished project", "How do you decide when an exploration is ready to become a publishable piece?"],
] as const;

const topicReplies = [
  ["seed-topic-01", 6, "I am turning a set of paper sketches into a small interactive story. The hardest part is choosing what to leave out."],
  ["seed-topic-01", 7, "That sounds lovely. I have found that making one intentionally tiny version helps me see the core idea."],
  ["seed-topic-02", 8, "We use a simple shared board for references and a weekly twenty-minute show-and-tell. The routine matters more than the tool."],
  ["seed-topic-02", 9, "For 3D work, versioned folders and a short changelog have saved us many times."],
  ["seed-topic-03", 10, "I try to describe what I noticed, why it matters, and one experiment to try next."],
  ["seed-topic-03", 11, "Asking a question before offering a solution keeps the conversation collaborative."],
  ["seed-topic-04", 0, "My favorite part is a little reference wall above the monitor. It changes every few weeks."],
  ["seed-topic-05", 3, "I keep a folder of packaging, signs, and menus. Ordinary typography is a surprisingly rich reference."],
  ["seed-topic-06", 4, "A deadline with a small audience helps me stop polishing details that no longer improve the idea."],
] as const;

const messageSets = [
  [0, 1, ["Hey Omar, your latest sound sketch is wonderful.", "Thank you! I was experimenting with recordings from the old market.", "The texture really comes through. I would love to collaborate sometime."]],
  [2, 3, ["Hi Noah, I liked your wayfinding project.", "Thanks, Sofia. I am still testing the type scale.", "I can share a few accessibility references if useful."]],
  [4, 5, ["Your generative garden has such a great rhythm.", "Appreciate that! I am trying to make the next version interactive.", "That would be fun to see when it is ready."]],
  [6, 7, ["Would you like to join the critique topic this week?", "Absolutely. I have been collecting notes on ambient publishing.", "Perfect, I will tag you when the next discussion starts."]],
  [8, 9, ["I am looking for an architectural visualizer for a small study.", "That sounds interesting. Send me the details and I will take a look.", "Thanks, I will put together a short brief."]],
  [10, 11, ["Your identity system is a great example of a flexible mark.", "Thank you! I liked keeping the system simple enough for the studio to own.", "That is exactly the direction I am exploring too."]],
] as const;

function dateDaysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const userIds: string[] = [];
  for (const [id, username, displayName, bio] of users) {
    const user = await db.user.upsert({
      where: { id },
      update: { username, bio },
      create: {
        id,
        clerkId: `seed_clerk_${id.slice(-2)}`,
        username,
        bio: `${displayName} - ${bio}`,
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${username}`,
        createdAt: dateDaysAgo(90 - userIds.length * 3),
      },
    });
    userIds.push(user.id);
  }

  const categoryIds = new Map<string, string>();
  for (const [slug, name] of categories) {
    const category = await db.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    categoryIds.set(slug, category.id);
  }

  const tagIds = new Map<string, string>();
  for (const [slug, name] of tags) {
    const tag = await db.tag.upsert({
      where: { slug },
      update: { name },
      create: { id: `seed-tag-${slug}`, slug, name },
    });
    tagIds.set(slug, tag.id);
  }

  const projectIds: string[] = [];
  for (let index = 0; index < projects.length; index += 1) {
    const [id, ownerIndex, categorySlug, title, description, projectTags] = projects[index];
    const project = await db.project.upsert({
      where: { id },
      update: { title, description },
      create: {
        id,
        userId: userIds[ownerIndex],
        categoryId: categoryIds.get(categorySlug)!,
        title,
        description,
        mediaUrl: `/uploads/demo/${id.toLowerCase()}.${categorySlug === "Audio" ? "mp3" : categorySlug === "PDF" ? "pdf" : categorySlug === "3D" ? "glb" : "jpg"}`,
        thumbnailUrl: `https://picsum.photos/seed/${id}/800/600`,
        likesCount: 0,
        viewsCount: 0,
        createdAt: dateDaysAgo(30 - index),
      },
    });
    projectIds.push(project.id);
    for (const tagSlug of projectTags) {
      await db.projectTag.upsert({
        where: { projectId_tagId: { projectId: project.id, tagId: tagIds.get(tagSlug)! } },
        update: {},
        create: { projectId: project.id, tagId: tagIds.get(tagSlug)! },
      });
    }
  }

  for (let index = 0; index < projectIds.length; index += 1) {
    const projectId = projectIds[index];
    for (let offset = 1; offset <= 4; offset += 1) {
      const userId = userIds[(index + offset) % userIds.length];
      await db.like.upsert({
        where: { userId_projectId: { userId, projectId } },
        update: {},
        create: { id: `seed-like-${index + 1}-${offset}`, userId, projectId, createdAt: dateDaysAgo(20 - offset) },
      });
      await db.projectEvent.upsert({
        where: { id: `seed-event-like-${index + 1}-${offset}` },
        update: {},
        create: { id: `seed-event-like-${index + 1}-${offset}`, projectId, actorId: userId, type: ProjectEventType.LIKE, createdAt: dateDaysAgo(20 - offset) },
      });
    }
    for (let viewIndex = 0; viewIndex < 6; viewIndex += 1) {
      await db.view.upsert({
        where: { id: `seed-view-${index + 1}-${viewIndex + 1}` },
        update: {},
        create: {
          id: `seed-view-${index + 1}-${viewIndex + 1}`,
          projectId,
          viewerId: viewIndex < 4 ? userIds[(index + viewIndex + 2) % userIds.length] : null,
          ipHash: `seed-ip-${index + 1}-${viewIndex + 1}`,
          createdAt: dateDaysAgo(12 - viewIndex),
        },
      });
    }
    await db.project.update({ where: { id: projectId }, data: { likesCount: 4, viewsCount: 6 } });
  }

  for (let index = 0; index < userIds.length; index += 1) {
    const followingId = userIds[(index + 1) % userIds.length];
    await db.follow.upsert({
      where: { followerId_followingId: { followerId: userIds[index], followingId } },
      update: {},
      create: { id: `seed-follow-${index + 1}`, followerId: userIds[index], followingId, createdAt: dateDaysAgo(18 - index) },
    });
  }

  for (let index = 0; index < projectIds.length; index += 1) {
    const commentId = `seed-comment-${index + 1}`;
    await db.comment.upsert({
      where: { id: commentId },
      update: {},
      create: {
        id: commentId,
        projectId: projectIds[index],
        userId: userIds[(index + 3) % userIds.length],
        body: ["The material study is excellent.", "This has a really clear visual rhythm.", "I would love to see a process breakdown for this."][index % 3],
        createdAt: dateDaysAgo(8 - (index % 4)),
      },
    });
  }

  for (let index = 0; index < forumTopics.length; index += 1) {
    const [id, authorIndex, title, body] = forumTopics[index];
    await db.forumTopic.upsert({
      where: { id },
      update: { title, body },
      create: { id, authorId: userIds[authorIndex], title, body, createdAt: dateDaysAgo(16 - index) },
    });
  }
  for (let index = 0; index < topicReplies.length; index += 1) {
    const [topicId, authorIndex, body] = topicReplies[index];
    const id = `seed-forum-post-${index + 1}`;
    await db.forumPost.upsert({
      where: { id },
      update: { body },
      create: { id, topicId, authorId: userIds[authorIndex], body, createdAt: dateDaysAgo(10 - (index % 5)) },
    });
  }

  for (let setIndex = 0; setIndex < messageSets.length; setIndex += 1) {
    const [firstIndex, secondIndex, bodies] = messageSets[setIndex];
    const [userOneId, userTwoId] = [userIds[firstIndex], userIds[secondIndex]].sort();
    const conversation = await db.conversation.upsert({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      update: { updatedAt: dateDaysAgo(setIndex + 1) },
      create: { id: `seed-conversation-${setIndex + 1}`, userOneId, userTwoId, createdAt: dateDaysAgo(14 - setIndex) },
    });
    for (let messageIndex = 0; messageIndex < bodies.length; messageIndex += 1) {
      const senderId = messageIndex % 2 === 0 ? userIds[firstIndex] : userIds[secondIndex];
      const recipientId = senderId === userIds[firstIndex] ? userIds[secondIndex] : userIds[firstIndex];
      await db.message.upsert({
        where: { id: `seed-message-${setIndex + 1}-${messageIndex + 1}` },
        update: { body: bodies[messageIndex] },
        create: {
          id: `seed-message-${setIndex + 1}-${messageIndex + 1}`,
          conversationId: conversation.id,
          senderId,
          recipientId,
          body: bodies[messageIndex],
          readAt: messageIndex < bodies.length - 1 ? dateDaysAgo(2) : null,
          createdAt: dateDaysAgo(6 - messageIndex, 10 + messageIndex),
        },
      });
    }
  }

  for (let index = 0; index < 10; index += 1) {
    await db.notification.upsert({
      where: { id: `seed-notification-${index + 1}` },
      update: {},
      create: {
        id: `seed-notification-${index + 1}`,
        recipientId: userIds[index % userIds.length],
        actorId: userIds[(index + 1) % userIds.length],
        type: index % 2 === 0 ? "LIKE" : "MESSAGE",
        projectId: index % 2 === 0 ? projectIds[index % projectIds.length] : null,
        readAt: index % 3 === 0 ? dateDaysAgo(1) : null,
        createdAt: dateDaysAgo(index % 7),
      },
    });
  }

  const counts = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.forumTopic.count(),
    db.forumPost.count(),
    db.conversation.count(),
    db.message.count(),
    db.follow.count(),
    db.like.count(),
    db.comment.count(),
  ]);
  console.log(JSON.stringify({
    users: counts[0],
    projects: counts[1],
    forumTopics: counts[2],
    forumPosts: counts[3],
    conversations: counts[4],
    messages: counts[5],
    follows: counts[6],
    likes: counts[7],
    comments: counts[8],
  }, null, 2));
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
