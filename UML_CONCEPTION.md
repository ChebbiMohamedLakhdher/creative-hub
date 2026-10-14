# CreativeHub — UML Conception

CreativeHub is a community platform that allows users to create a profile,
publish creative projects, discover the work of other creators, and interact
with the community.

This document provides the conceptual description needed to create the UML
diagrams for the application.

## 1. System actors

### Unauthenticated user

A visitor can:

- Browse public and active projects.
- Search for projects.
- Filter projects by category.
- Use the natural-language inspiration search.
- View public creator profiles.
- View public forum discussions.
- Sign up or sign in.

### Authenticated user

An authenticated user can:

- Manage their profile.
- Publish a creative project.
- Edit their personal information.
- Upload a project file and preview image.
- View, edit, or delete their own projects when available.
- Like or unlike a project.
- Comment on a project and reply to a comment.
- Follow or unfollow another user.
- Send and receive private messages.
- Create forum topics.
- Reply to existing forum topics.
- Receive and read notifications.
- Report content.

### Administrator

An administrator is a user with additional permissions. They can:

- Access the administration dashboard.
- Review reported content.
- Moderate projects.
- Change the moderation status of a project.
- Manage reports.
- Perform administrative actions.
- Consult audit logs.

### Clerk

Clerk is an external authentication service responsible for:

- User registration.
- User sign-in.
- Identity management.
- User authentication.
- Synchronizing authenticated users with the local `User` table.

### Storage system

The storage system stores:

- Project files.
- Thumbnail and preview images.
- GLB and GLTF files.
- Image files.
- Audio files.
- PDF files.

In the current version, files are stored in `public/uploads`. In Docker,
uploads are persisted through a named volume.

### PostgreSQL database

PostgreSQL stores:

- Users.
- Projects.
- Categories.
- Tags.
- Likes.
- Views.
- Comments.
- Follow relationships.
- Notifications.
- Messages.
- Forum data.
- Reports.
- Project events.
- Audit logs.

## 2. Main use cases

### Account and profile management

#### Create an account

1. The visitor opens the registration page.
2. Clerk validates the registration information.
3. Clerk creates the user's identity.
4. The application receives the user information.
5. A local `User` record is created in PostgreSQL.

#### Sign in

1. The user enters their credentials.
2. Clerk verifies the identity.
3. Clerk returns a valid session.
4. The application authorizes access to protected features.

#### Manage a profile

The user can:

- Edit their username.
- Edit their biography.
- Change their avatar.
- View their own projects.
- View another creator's projects.

### Creative project management

#### Publish a project

1. The authenticated user opens the project publication form.
2. They enter the title and description.
3. They select a category.
4. They upload a file.
5. The system validates:
   - The extension.
   - The MIME type.
   - The maximum file size.
   - The selected category.
   - The optional preview image.
6. The file is saved in storage.
7. A `Project` object is created.
8. The project receives visibility and moderation statuses.
9. The project becomes publicly visible if it is active and public.

#### View a project

The project detail page uses a viewer adapted to the project category:

- 3D project: GLB/GLTF viewer.
- Image project: image gallery or image viewer.
- Audio project: audio player.
- PDF project: PDF viewer.

#### Discover projects

Users can search for projects using:

- Text.
- Category.
- Creator.
- Publication order.
- Popularity.
- Tags.

Public discovery returns only projects that are active and public.

#### Search for inspiration

The user enters a natural-language request, for example:

> I need an ambient soundtrack for a short film.

The system:

1. Normalizes the query.
2. Removes common stop words.
3. Detects keywords.
4. Expands selected terms with local synonyms.
5. Detects a likely project category.
6. Loads active and public projects.
7. Calculates a relevance score.
8. Sorts the projects by relevance.
9. Returns a small list of suggestions.
10. Explains why each project was selected.

The search is local and transparent. The query and project data are not sent
to an external AI service.

## 3. Social interactions

### Likes

An authenticated user can like or unlike a project.

The `Like` association represents:

```text
User 1 -------- * Like * -------- 1 Project
```

Constraints:

- A user can like a project only once.
- The combination `userId + projectId` is unique.
- A like can create a notification for the project owner.

### Views

Each project consultation can create a `View` event.

```text
User 0..1 -------- * View * -------- 1 Project
```

A view may belong to an authenticated user or an anonymous visitor.

Views are used to:

- Count project consultations.
- Determine trending projects.
- Build daily view aggregates.

### Comments

An authenticated user can comment on a project.

```text
User 1 -------- * Comment * -------- 1 Project
```

A comment can have replies through a self-referencing relationship:

```text
Comment 0..1 -------- * Comment
```

This allows nested discussions below a project.

### Shares and activity events

Project activity can be recorded as a `ProjectEvent`.

```text
User 1 -------- * ProjectEvent * -------- 1 Project
```

Possible event types include:

- View.
- Like.
- Unlike.
- Share.
- Comment.

### Following users

An authenticated user can follow another user.

```text
User follower 1 -------- * Follow * -------- 1 User following
```

Constraints:

- The same follow relationship cannot be inserted twice.
- A user should not be able to follow themselves.
- A new follow relationship can create a notification.

## 4. Notifications

A notification informs a user about activity involving them or their content.

A notification can contain:

- A recipient.
- An optional actor.
- An optional project.
- An optional comment.
- An optional forum topic.
- A notification type.
- A read/unread state.
- A creation timestamp.

Example:

```text
User A likes User B's project
```

The system creates:

```text
Notification
recipient = User B
actor = User A
project = Project
type = LIKE
isRead = false
```

Relationships:

```text
User 1 -------- * Notification : receives
User 0..1 -------- * Notification : triggers
Project 0..1 -------- * Notification
Comment 0..1 -------- * Notification
ForumTopic 0..1 -------- * Notification
```

## 5. Community forum

### Create a forum topic

An authenticated user can create a `ForumTopic`.

A topic contains:

- A title.
- A body.
- An author.
- A creation timestamp.
- An update timestamp.
- A collection of replies.

```text
User 1 -------- * ForumTopic
ForumTopic 1 -------- * ForumPost
```

### Reply to a forum topic

An authenticated user can add a `ForumPost` to a topic.

A forum post contains:

- An author.
- The topic to which it belongs.
- A body.
- A creation timestamp.
- An update timestamp.

When a user replies to a topic, the topic author can receive a notification.

## 6. Private messaging

The messaging system allows two users to exchange private messages.

### Conversation

A conversation is associated with two users:

```text
Conversation 1 -------- 1 User
Conversation 1 -------- 1 User
```

The pair of user IDs is normalized so that the same two users always share one
conversation, regardless of who starts the conversation.

### Message

A conversation contains multiple messages:

```text
Conversation 1 -------- * Message
User 1 -------- * Message : sender
User 1 -------- * Message : recipient
```

A message contains:

- A sender.
- A recipient.
- A conversation.
- Text content.
- A creation timestamp.
- An optional read timestamp.

When a conversation is opened, unread messages can be marked as read.

## 7. Moderation and administration

### Report content

An authenticated user can report a project or another supported piece of
content.

A report contains:

- The reporting user.
- The reported content.
- The reason.
- The report status.
- A creation timestamp.
- Optionally, the administrator who handled the report.

Possible report lifecycle:

```text
PENDING -> IN_REVIEW -> RESOLVED
```

or:

```text
PENDING -> REJECTED
```

### Moderate a project

An administrator can change the moderation status of a project:

```text
PENDING
APPROVED
REJECTED
FLAGGED
```

Public visibility depends on:

- The project's visibility state.
- The project's moderation status.
- The project's active state.

### Audit logs

Important administrative actions can create an `AuditLog` record.

Examples:

- Approving a project.
- Rejecting a project.
- Updating a report.
- Deleting content.
- Changing a moderation status.

## 8. Conceptual class model

The main domain classes are:

```text
User
Category
Project
Tag
ProjectTag
Like
View
ViewDailyAggregate
Comment
Follow
Notification
Report
ProjectEvent
AuditLog
Conversation
Message
ForumTopic
ForumPost
```

### Main relationships

```text
User 1 -------- * Project
Category 1 -------- * Project

Project * -------- * Tag
```

The many-to-many relationship between `Project` and `Tag` is represented by
the association class `ProjectTag`.

```text
User 1 -------- * Like
Project 1 -------- * Like

User 1 -------- * View
Project 1 -------- * View

User 1 -------- * Comment
Project 1 -------- * Comment

User 1 -------- * Follow : follower
User 1 -------- * Follow : following

User 1 -------- * Notification : recipient
User 0..1 -------- * Notification : actor

User 1 -------- * ForumTopic
ForumTopic 1 -------- * ForumPost
User 1 -------- * ForumPost

Conversation 1 -------- * Message
User 1 -------- * Message : sender
User 1 -------- * Message : recipient

User 1 -------- * Report
Project 0..1 -------- * Report

User 0..1 -------- * AuditLog
Project 0..1 -------- * AuditLog
```

## 9. Important enumerations

### Project category

```text
CategoryType
----------------
MODEL_3D
IMAGE
AUDIO
PDF
```

### Project visibility

```text
Visibility
----------------
PUBLIC
PRIVATE
UNLISTED
```

### Moderation status

```text
ModerationStatus
----------------
PENDING
APPROVED
REJECTED
FLAGGED
```

### Report status

```text
ReportStatus
----------------
PENDING
IN_REVIEW
RESOLVED
REJECTED
```

### Notification type

```text
NotificationType
----------------
LIKE
COMMENT
FOLLOW
MESSAGE
FORUM_REPLY
PROJECT_MODERATION
SYSTEM
```

### Project event type

```text
ProjectEventType
----------------
VIEW
LIKE
UNLIKE
SHARE
COMMENT
```

## 10. Use-case diagram structure

The main use-case diagram can contain the following structure:

```text
                         +----------------------+
                         |      CreativeHub     |
                         +----------------------+
                                      |
        +-----------------------------+-----------------------------+
        |                             |                             |
 Unauthenticated user       Authenticated user              Administrator
        |                             |                             |
        |                             |                             |
 Browse projects              Manage profile                 Manage users
 Search projects              Publish project                Moderate projects
 Filter projects              Edit project                   Handle reports
 View profiles                Like project                   View audit logs
 Use discovery                Comment                         |
 Sign up / sign in            Follow users                   |
                              Send messages                  |
                              Use forum                      |
                              Read notifications              |
```

### Possible `include` relationships

```text
Publish project
    <<include>> Authenticate user
    <<include>> Validate file
    <<include>> Store file
    <<include>> Create project

Like project
    <<include>> Authenticate user
    <<include>> Check like uniqueness
    <<include>> Create notification

Reply to forum topic
    <<include>> Authenticate user
    <<include>> Create notification

Send message
    <<include>> Authenticate user
    <<include>> Get or create conversation
```

## 11. Sequence scenario: publish a project

### Preconditions

The user is authenticated.

### Main flow

1. The user opens the project publication form.
2. The user enters the title, description, and category.
3. The user selects a file.
4. The frontend sends the data to the API.
5. The API verifies the Clerk session.
6. The validation service checks the file.
7. The storage service saves the file.
8. The project service creates the project in PostgreSQL.
9. The project receives an initial moderation status.
10. The API returns a success response.
11. The project appears in the user's portfolio.

### Objects involved

```text
User
ProjectUploadPage
ProjectAPI
AuthenticationService
FileValidationService
StorageService
ProjectService
Project
Database
```

## 12. Sequence scenario: like a project

1. The user opens a project page.
2. The user clicks the Like button.
3. The frontend sends the project ID.
4. The API verifies authentication.
5. The system checks whether the like already exists.
6. If the like does not exist:
   - A `Like` object is created.
   - The project like counter is updated.
   - A notification is created.
7. The interface displays the updated like count.

If the like already exists, the system can perform an unlike operation.

## 13. Technical component architecture

The component diagram can use the following components:

```text
[Browser]
     |
     v
[Next.js Application]
     |
     +-- [React Components]
     +-- [App Router Pages]
     +-- [API Routes]
     +-- [Application Services]
     +-- [Authentication Helpers]
     +-- [Validation Services]
     +-- [Discovery Service]
     +-- [Storage Service]
     |
     +-- [Clerk Authentication]
     |
     +-- [Prisma ORM]
             |
             v
       [PostgreSQL]

[Storage Service]
     |
     v
[Uploaded Files / Docker Volume]
```

## 14. Deployment architecture

The Docker deployment can be represented as:

```text
[Docker Compose]
       |
       +------------------+
       |                  |
       v                  v
[CreativeHub App]   [PostgreSQL DB]
       |
       v
[Uploads Volume]
```

The application container:

- Runs the Next.js application.
- Uses Prisma to communicate with PostgreSQL.
- Runs as a non-root user.
- Exposes port 3000.
- Uses the persistent uploads volume.

The database container:

- Runs PostgreSQL.
- Uses a persistent database volume.
- Provides a health check.
- Must be healthy before the application starts.

## 15. General system behavior

CreativeHub is centered around the `User` entity. A user can create several
projects and interact with the projects of other users.

The `Project` entity is the central content entity. It belongs to a user, has
a category, can have several tags, and can receive:

- Likes.
- Views.
- Comments.
- Shares.
- Reports.
- Activity-related notifications.

Users can create social relationships through `Follow`, discuss projects
through `Comment`, participate in the community through `ForumTopic` and
`ForumPost`, and communicate privately through `Conversation` and `Message`.

Administrators manage moderation and traceability through `Report`,
`AuditLog`, and moderation statuses.

```text
User
    ├── owns projects
    ├── follows other users
    ├── likes projects
    ├── comments on projects
    ├── views projects
    ├── creates forum topics
    ├── replies to topics
    ├── exchanges private messages
    ├── receives notifications
    └── reports content

Project
    ├── belongs to a category
    ├── has tags
    ├── contains a creative file
    ├── receives likes
    ├── receives views
    ├── receives comments
    ├── can be shared
    ├── can be reported
    └── can be moderated by an administrator
```

## 16. Recommended UML diagrams

The following diagrams are recommended:

1. **Use-case diagram** — Shows the features available to visitors,
   authenticated users, and administrators.
2. **Class diagram** — Shows the domain entities and their relationships.
3. **Sequence diagram** — Shows project publication, liking a project,
   sending a message, and creating a forum topic.
4. **Component diagram** — Shows the browser, Next.js application, Clerk,
   Prisma, PostgreSQL, and file storage.
5. **Deployment diagram** — Shows the Docker containers, database, application,
   and persistent volumes.

## 17. Short overall summary

CreativeHub is a full-stack creative community platform. Users authenticate
through Clerk, maintain profiles, publish different types of creative media,
and discover public projects through filters, search, and local
natural-language ranking.

The social layer allows users to like projects, view content, comment, follow
creators, exchange private messages, and participate in forum discussions.
Notifications connect these activities to their recipients. Administrators
moderate projects and reports while audit logs record important actions.

The technical architecture consists of a browser, a Next.js application,
server-side API routes, application services, Clerk authentication, Prisma
ORM, PostgreSQL, and persistent file storage. Docker Compose packages the
application and database for local or production-like execution.
