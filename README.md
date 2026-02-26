# LaTeX Collaborative Editor
A real-time collaborative LaTeX editor built with a microservices architecture. This project enables multiple users to edit LaTeX documents simultaneously with seamless file management and secure authentication.

---

## Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **React** + **Tailwind CSS** | Responsive UI & Editor Interface |
| **Real-time** | **Yjs** | Conflict-free Replicated Data Types (CRDT) |
| **Auth Service** | **ASP.NET Core** | Secure JWT-based identity management |
| **File Service** | **ASP.NET Core** | Handling LaTeX document I/O and exports |
| **Collaboration Service** | **Node.js** | Shared state syncronization and file management|
| **Database** | **PostgreSQL** | Persistent storage for users and documents |
| **DevOps** | **Docker** | Containerization and orchestration |

---

## Architecture Overview
The system is designed as a suite of independent microservices to ensure scalability:
* **Client:** React-based frontend utilizing **Tailwind CSS** for a clean, utility-first user interface.
* **Auth Service:** A C# / ASP.NET service handling user registration, login, and token validation.
* **File Service:** A C# / ASP.NET service dedicated to managing the document lifecycle, document sharing and file system interactions.
* **Collaboration Service:** A Node.js microservice utilizing **Yjs** for shared state synchronization.

---

## Quick Start (Local Development)

This project is fully containerized. You do not need to install local runtimes for .NET, Node, or Postgres. You only need **Docker** and **Docker Compose**.

### 1. Clone the repository
```bash
git clone [https://github.com/breezetall/Latex-Editor.git](https://github.com/breezetall/Latex-Editor.git)
cd Latex-Editor
```

### 2. Launch the entire stack
Run the following command to build the services and start:
```bash
docker compose up --build
```

Once the terminal shows the services are running, open your browser to: http://localhost:5173

### Key Features

* Real-time Collaboration: Powered by Yjs and Y-websocket for seamless multi-user editing.

* Responsive Design: Fluid and responsive UI.

* Secure: JWT-based authentication flow, ASP.NET Identity for user management.

* Microservice Scalability: Each component can be scaled or updated independently. 

* Database: EF core (Entity Framework) faciliating communications between services and Postgres.