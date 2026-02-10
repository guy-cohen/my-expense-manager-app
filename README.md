# 💰 Expense Manager (מנהל הוצאות)

A Hebrew-language personal finance management web application built with Flask and SQLite. Track your income and expenses, visualize spending patterns with interactive charts, and export your data to CSV.

![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- **Add Transactions** — Record income and expenses with category, amount, and date
- **Edit & Delete** — Modify or remove existing transactions via a modal dialog
- **Dashboard Cards** — View total income, total expenses, and current balance at a glance
- **Interactive Charts** — Bar chart comparing income vs. expenses, and a doughnut chart showing expense breakdown by category (powered by Chart.js)
- **Filtering & Search** — Filter transactions by type, category, time period (month/year), or free-text search
- **Sortable Table** — Click column headers to sort transactions by date, amount, category, or type
- **CSV Export** — Export all transactions to a CSV file (with Hebrew headers), preserving the current sort order
- **Dark/Light Theme** — Toggle between dark and light mode with a single click
- **RTL Support** — Fully right-to-left Hebrew interface
- **Responsive Design** — Works on desktop and mobile devices

## 🛠️ Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Backend    | Python, Flask               |
| Database   | SQLite                      |
| Frontend   | HTML, CSS, JavaScript       |
| Charts     | Chart.js (via CDN)          |
| Deployment | Apache (optional, config included) |

## 🚀 Getting Started

### Prerequisites

- **Python 3.7+** installed on your system
- **pip** (Python package manager)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/guy-cohen/my-expense-manager-app.git
   cd my-expense-manager-app
   ```

2. **Create a virtual environment (recommended):**

   ```bash
   python3 -m venv venv
   source venv/bin/activate        # macOS / Linux
   # venv\Scripts\activate          # Windows
   ```

3. **Install dependencies:**

   ```bash
   pip install flask
   ```

### Running the App

```bash
python3 app.py
```

The app will:
- Initialize the SQLite database (`database.db`) automatically on first run
- Start a development server on **http://0.0.0.0:8080**

Open your browser and navigate to **http://localhost:8080** to start managing your expenses.

### Production Deployment (Apache)

An Apache configuration file (`apache_config.conf`) is included for deploying with `mod_wsgi`. Adjust the paths in the config to match your server setup.

## 📁 Project Structure

```
my-expense-manager-app/
├── app.py                  # Flask application (routes, API, database logic)
├── apache_config.conf      # Apache deployment configuration
├── database.db             # SQLite database (auto-created on first run)
├── README.md               # This file
├── .gitignore              # Git ignore rules
├── static/
│   ├── script.js           # Client-side JavaScript (filters, sorting, theme, modals)
│   └── style.css           # Stylesheet (dark/light themes, responsive layout)
└── templates/
    └── index.html          # Main HTML template (Jinja2)
```

## 📸 Usage

1. **Add a transaction** — Select income or expense, choose a category, enter the amount and date, then click "הוסף תנועה"
2. **Filter transactions** — Use the search bar, type dropdown, or period selector to narrow down results
3. **Edit a transaction** — Click the ✏️ button on any row to open the edit modal
4. **Delete a transaction** — Click the 🗑️ button and confirm the deletion
5. **Export to CSV** — Click "ייצא לקובץ CSV" to download all transactions as a CSV file
6. **Toggle theme** — Click the 🌙 button in the top corner to switch between dark and light mode

## 🔌 API Endpoints

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/`                    | Main dashboard page                      |
| POST   | `/add`                 | Add a new transaction                    |
| GET    | `/delete/<id>`         | Delete a transaction                     |
| GET    | `/get/<id>`            | Get a single transaction (JSON)          |
| POST   | `/edit/<id>`           | Update an existing transaction           |
| GET    | `/api/transactions`    | Filtered transactions with totals (JSON) |
| GET    | `/api/available-periods` | Available months/years for filters (JSON) |
| POST   | `/export`              | Export transactions to CSV               |
| GET    | `/stats`               | Monthly and category statistics (JSON)   |
