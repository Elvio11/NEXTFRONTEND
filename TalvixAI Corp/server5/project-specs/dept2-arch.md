# System Architecture: Talvix AI Corp - Dept 2 (Chief of Staff)

## 1. High-Level Architecture
The Dept 2 service follows a **Hexagonal / Clean Architecture** pattern implemented with FastAPI to ensure separation of concerns between business logic (CoS operations) and infrastructure (DB, Auth).

## 2. Components
### A. Presentation Layer (FastAPI)
- **Routers**: Entity-scoped routers (`initiatives.py`, `briefings.py`, `tasks.py`).
- **Middleware**: JWT Auth, CORS, Gzip, and Prometheus monitoring.
- **Dependency Injectors**: Database sessions (`get_db`) and Auth guards (`get_current_user`).

### B. Domain Layer (Services)
- **CoS Logic**: Handles state transitions for initiatives and approval workflows for communications.
- **Orchestration**: Manages cross-departmental task dependencies.

### C. Resource Layer (Persistence)
- **SQLAlchemy 2.0 (Async)**: Communicates with PostgreSQL cluster.
- **Repository Pattern**: Abstracted data access layers for `StrategicInitiative`, `ExecutiveBriefing`, etc.
- **Redis**: Temporary cache for aggregated metrics and rate limiting.

## 3. Data Flow
1. **Request**: Incoming client request via HTTPS (REST).
2. **Auth**: JWT validated by `OAuth2PasswordBearer`.
3. **Controller**: Router parses Pydantic schema and calls relevant Service.
4. **Logic**: Service executes business rules, potentially calling the Repository.
5. **Persistence**: Repository performs async DB operation.
6. **Response**: Service returns domain object; Router serializes via Pydantic response model.

## 4. Design Patterns
- **Singleton**: Database connection pool and configuration management.
- **Factory**: For creating complex data objects (e.g., generating a full briefing from a template).
- **Observer/Hooks**: Post-save hooks for sending notifications (Integrate with Server 1 Baileys in later phase).

## 5. Security Architecture
- **JWT**: Stateless session management with 15-min expiry and refresh tokens.
- **RBAC**: Permission checks at the dependency level.
- **Prepared Statements**: Forced via SQLAlchemy ORM to prevent SQLi.
- **Pydantic Validation**: Strict type enforcement and sanitization for all inputs.
- **Docker Isolation**: Non-root user within the container.
- **Sensitive Config**: Managed via environment variables and stored in `.env`.