# TaskFlow - Task Management System

TaskFlow is a full-stack task management and collaboration system. The application allows users to manage projects, project groups, tasks, comments, attachments and notifications in one clean workspace.

The system is built with a React + TypeScript frontend and a Node.js + Express + MongoDB backend.

---

## GitHub Repository

https://github.com/GeorgiRaichev/task-management-system.git

---

## Main Features

* User registration and login
* JWT authentication
* Protected routes
* Dashboard with project and task statistics
* Project management
* Project groups
* Task board with columns
* Drag and drop task status update
* Task assignment to project group members
* Task comments
* Task attachments
* Notifications
* User roles and permissions
* Profile page
* Admin users management

---

## Technologies

### Frontend

* React
* TypeScript
* Vite
* Material UI
* Redux Toolkit
* RTK Query
* React Router
* Day.js

### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* JWT Authentication
* Cookie Parser
* CORS
* Socket.IO
* Multer

### Database

* MongoDB Atlas

---

## Project Structure

```txt
task-management-system
├── api
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── validators
│   │   └── index.ts
│   ├── package.json
│   └── .env.example
│
├── client
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   ├── features
│   │   ├── hooks
│   │   ├── i18n
│   │   ├── layouts
│   │   ├── pages
│   │   ├── routes
│   │   └── utils
│   ├── package.json
│   └── .env.example
│
├── docs
│   ├── TaskFlow-documentation.docx
│   ├── TaskFlow-documentation.pdf
│   └── TaskFlow-presentation.pptx
│
├── README.md
└── .gitignore
```

---

## Application Modules

### Authentication

The authentication module allows users to register, log in, log out and keep their session active.

Main functionality:

* Register new account
* Login with email and password
* Logout
* Get current authenticated user
* Protected frontend routes

---

### Dashboard

The dashboard provides a quick overview of the current system state.

It displays:

* Total projects
* Active tasks
* Completed tasks
* Unread notifications

---

### Projects

The projects module allows users with the required permissions to create, edit, delete and view projects.

A project contains:

* Name
* Description
* Status
* Creator

Projects are the main structure of the system. Tasks and groups are connected to projects.

---

### Project Groups

Project groups define which users are part of a project. A project must have a group before tasks can be managed.

Main functionality:

* Create group for project
* Add members
* Set member roles
* Edit group
* Delete group

Each project can have only one group.

---

### Tasks

Tasks are created inside projects and can be assigned to users from the project group.

A task contains:

* Title
* Description
* Assigned user
* Priority
* Status
* Due date
* Created by
* Project

Task statuses:

* To do
* In progress
* Review
* Done

Task priorities:

* Low
* Medium
* High

Users can move tasks between columns using drag and drop. Assigned users can update the status of their own tasks. Project managers, project creators and administrators can fully manage tasks.

---

### Comments

Each task can have comments. Comments are used for communication between project members about a specific task.

Main functionality:

* Add comment to task
* Edit own comment
* Delete own comment
* Administrator can delete comments
* Notifications are sent when a comment is added

When a comment is added, the assigned user and the task creator receive a notification, unless the comment author is the same user.

---

### Attachments

Attachments can be uploaded to a specific task. This allows users to add images, documents or other files related to the task.

Main functionality:

* Upload file to task
* View task attachments
* Open uploaded file
* Delete attachment
* Notifications are sent when an attachment is added

Uploaded files are stored in the backend uploads folder.

---

### Notifications

The notification module informs users about important events.

Notification examples:

* Task assigned
* Task status changed
* Comment added
* Attachment added

Main functionality:

* View notifications
* Mark notification as read
* Mark all notifications as read
* Delete notification

---

### Profile

The profile page displays information about the currently logged-in user.

---

### Users Management

The users management page is available for administrators. It allows administrators to view and manage users in the system.

---

## User Roles

### Registered User

A registered user can participate in projects, view assigned tasks, update task status and add comments.

### Project Manager

A project manager can manage tasks in the project group and organize work between members.

### Administrator

An administrator has full access to the system and can manage users, projects, groups, tasks and other resources.

---

## Backend API Routes

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Users

```txt
GET /api/users
GET /api/users/select-options
GET /api/users/:userId
PUT /api/users/:userId
DELETE /api/users/:userId
```

### Projects

```txt
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PUT    /api/projects/:projectId
DELETE /api/projects/:projectId
```

### Groups

```txt
GET    /api/groups
POST   /api/groups
GET    /api/groups/:groupId
PUT    /api/groups/:groupId
DELETE /api/groups/:groupId
```

### Tasks

```txt
GET    /api/tasks/project/:projectId
POST   /api/tasks/project/:projectId
GET    /api/tasks/:taskId
PUT    /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

### Comments

```txt
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
GET    /api/comments/:commentId
PUT    /api/comments/:commentId
DELETE /api/comments/:commentId
```

### Attachments

```txt
GET    /api/tasks/:taskId/attachments
POST   /api/tasks/:taskId/attachments
GET    /api/attachments/:attachmentId
DELETE /api/attachments/:attachmentId
```

### Notifications

```txt
GET    /api/notifications
PATCH  /api/notifications/:notificationId/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:notificationId
```

### Profile

```txt
GET /api/profile
PUT /api/profile
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/GeorgiRaichev/task-management-system.git
cd task-management-system
```

---

## Backend Setup

Go to the backend folder:

```bash
cd api
```

Install dependencies:

```bash
npm install
```

Create `.env` file in the `api` folder.

Example:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Start the backend server:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

Health check:

```txt
http://localhost:5000/api/health
```

---

## Frontend Setup

Go to the frontend folder:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create `.env` file in the `client` folder.

Example:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

## Environment Files

Real `.env` files should not be uploaded publicly.

Use example files instead:

```txt
api/.env.example
client/.env.example
```

### api/.env.example

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### client/.env.example

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Documentation

Project documentation and presentation are located in the `/docs` folder.

```txt
docs
├── TaskFlow-documentation.docx
├── TaskFlow-documentation.pdf
└── TaskFlow-presentation.pptx
```

---

## Running the Project

Start backend:

```bash
cd api
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

Open the application:

```txt
http://localhost:5173
```

---

## Important Notes for Submission

The submitted ZIP archive should include:

```txt
api
client
docs
README.md
.gitignore
```

The submitted ZIP archive should not include:

```txt
node_modules
.env
dist
build
```

Before creating the ZIP file, remove:

```txt
api/node_modules
client/node_modules
api/.env
client/.env
```

---

## Author

Georgi Raichev

Project: TaskFlow - Task Management System

GitHub: https://github.com/GeorgiRaichev/task-management-system.git
