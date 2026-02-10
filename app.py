from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify
import sqlite3
import csv
from datetime import datetime
from io import StringIO
from calendar import monthrange

app = Flask(__name__)

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS transactions 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       type TEXT NOT NULL, 
                       category TEXT NOT NULL, 
                       amount REAL NOT NULL, 
                       date TEXT NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Main dashboard page"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch all transactions ordered by date (newest first)
    cursor.execute("SELECT * FROM transactions ORDER BY date DESC, id DESC")
    transactions = cursor.fetchall()

    # Calculate total income
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Income'")
    total_income = cursor.fetchone()[0]

    # Calculate total expenses
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Expense'")
    total_expenses = cursor.fetchone()[0]

    # Calculate balance
    balance = total_income - total_expenses

    conn.close()
    
    return render_template('index.html', 
                         transactions=transactions, 
                         total_income=total_income, 
                         total_expenses=total_expenses, 
                         balance=balance)

@app.route('/add', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    if request.method == 'POST':
        try:
            transaction_type = request.form.get('type', '').strip()
            category = request.form.get('category', '').strip()
            amount = request.form.get('amount', '').strip()
            date = request.form.get('date', '').strip()

            # Validate inputs
            if not all([transaction_type, category, amount, date]):
                return redirect(url_for('index'))
            
            # Validate amount is a positive number
            try:
                amount_float = float(amount)
                if amount_float <= 0:
                    return redirect(url_for('index'))
            except ValueError:
                return redirect(url_for('index'))

            # Validate date format
            try:
                datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                return redirect(url_for('index'))

            # Insert transaction
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transactions (type, category, amount, date) VALUES (?, ?, ?, ?)",
                (transaction_type, category, amount_float, date)
            )
            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Error adding transaction: {e}")
            return redirect(url_for('index'))

    return redirect(url_for('index'))

@app.route('/delete/<int:id>')
def delete_transaction(id):
    """Delete a transaction by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error deleting transaction: {e}")
    
    return redirect(url_for('index'))

@app.route('/get/<int:id>')
def get_transaction(id):
    """Get a single transaction by ID for editing"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, category, amount, date FROM transactions WHERE id = ?", (id,))
        transaction = cursor.fetchone()
        conn.close()
        
        if transaction:
            return jsonify({
                'id': transaction['id'],
                'type': transaction['type'],
                'category': transaction['category'],
                'amount': transaction['amount'],
                'date': transaction['date']
            })
        else:
            return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        print(f"Error getting transaction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/edit/<int:id>', methods=['POST'])
def edit_transaction(id):
    """Edit an existing transaction"""
    try:
        transaction_type = request.form.get('type', '').strip()
        category = request.form.get('category', '').strip()
        amount = request.form.get('amount', '').strip()
        date = request.form.get('date', '').strip()

        # Validate inputs
        if not all([transaction_type, category, amount, date]):
            return redirect(url_for('index'))
        
        # Validate amount is a positive number
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                return redirect(url_for('index'))
        except ValueError:
            return redirect(url_for('index'))

        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return redirect(url_for('index'))

        # Update transaction
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE transactions SET type = ?, category = ?, amount = ?, date = ? WHERE id = ?",
            (transaction_type, category, amount_float, date, id)
        )
        conn.commit()
        conn.close()

    except Exception as e:
        print(f"Error editing transaction: {e}")
    
    return redirect(url_for('index'))

@app.route('/api/transactions')
def api_transactions():
    """API endpoint for filtered transactions"""
    try:
        # Get filter parameters
        filter_type = request.args.get('type', '')
        filter_category = request.args.get('category', '')
        filter_search = request.args.get('search', '')
        filter_month = request.args.get('month', '')  # Format: YYYY-MM
        filter_year = request.args.get('year', '')    # Format: YYYY
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with filters
        query = "SELECT id, type, category, amount, date FROM transactions WHERE 1=1"
        params = []
        
        if filter_type:
            query += " AND type = ?"
            params.append(filter_type)
        
        if filter_category:
            query += " AND category = ?"
            params.append(filter_category)
        
        if filter_search:
            query += " AND (category LIKE ? OR CAST(amount AS TEXT) LIKE ?)"
            search_term = f"%{filter_search}%"
            params.extend([search_term, search_term])
        
        if filter_month:
            query += " AND strftime('%Y-%m', date) = ?"
            params.append(filter_month)
        elif filter_year:
            query += " AND strftime('%Y', date) = ?"
            params.append(filter_year)
        
        query += " ORDER BY date DESC, id DESC"
        
        cursor.execute(query, params)
        transactions = cursor.fetchall()
        
        # Calculate totals for filtered results
        total_query = """
            SELECT
                COALESCE(SUM(CASE WHEN type='Income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type='Expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions WHERE 1=1
        """
        
        if filter_type:
            total_query += " AND type = ?"
        if filter_category:
            total_query += " AND category = ?"
        if filter_search:
            total_query += " AND (category LIKE ? OR CAST(amount AS TEXT) LIKE ?)"
        if filter_month:
            total_query += " AND strftime('%Y-%m', date) = ?"
        elif filter_year:
            total_query += " AND strftime('%Y', date) = ?"
        
        cursor.execute(total_query, params)
        totals = cursor.fetchone()
        
        # Get category breakdown for expenses (for pie chart)
        category_query = """
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE type = 'Expense'
        """
        category_params = []
        
        if filter_type and filter_type == 'Expense':
            pass  # Already filtering by Expense
        elif filter_type and filter_type == 'Income':
            # If filtering by Income only, return empty category breakdown
            category_query = "SELECT '' as category, 0 as total WHERE 0"
        
        if filter_category:
            category_query += " AND category = ?"
            category_params.append(filter_category)
        
        if filter_search:
            category_query += " AND (category LIKE ? OR CAST(amount AS TEXT) LIKE ?)"
            search_term = f"%{filter_search}%"
            category_params.extend([search_term, search_term])
        
        if filter_month:
            category_query += " AND strftime('%Y-%m', date) = ?"
            category_params.append(filter_month)
        elif filter_year:
            category_query += " AND strftime('%Y', date) = ?"
            category_params.append(filter_year)
        
        category_query += " GROUP BY category ORDER BY total DESC"
        
        cursor.execute(category_query, category_params)
        category_breakdown = [{'category': row['category'], 'total': row['total']} for row in cursor.fetchall()]
        
        # Get available months and years for filter dropdowns
        cursor.execute("SELECT DISTINCT strftime('%Y-%m', date) as month FROM transactions ORDER BY month DESC")
        available_months = [row['month'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT DISTINCT strftime('%Y', date) as year FROM transactions ORDER BY year DESC")
        available_years = [row['year'] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'transactions': [dict(row) for row in transactions],
            'total_income': totals['income'],
            'total_expenses': totals['expense'],
            'balance': totals['income'] - totals['expense'],
            'category_breakdown': category_breakdown,
            'available_months': available_months,
            'available_years': available_years
        })
    
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/available-periods')
def available_periods():
    """Get available months and years for filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT strftime('%Y-%m', date) as month FROM transactions ORDER BY month DESC")
        months = [row['month'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT DISTINCT strftime('%Y', date) as year FROM transactions ORDER BY year DESC")
        years = [row['year'] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'months': months,
            'years': years
        })
    
    except Exception as e:
        print(f"Error getting periods: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/export', methods=['POST'])
def export_to_csv():
    """Export all transactions to CSV file matching current table sort order"""
    try:
        # Get sort parameters from form
        sort_column = request.form.get('sort_column', 'date')
        sort_direction = request.form.get('sort_direction', 'desc')
        
        # Map column names to database fields
        column_map = {
            'date': 'date',
            'amount': 'amount',
            'category': 'category',
            'type': 'type'
        }
        
        # Validate and get the actual column name
        db_column = column_map.get(sort_column, 'date')
        direction = 'DESC' if sort_direction == 'desc' else 'ASC'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with dynamic sorting
        query = f"SELECT id, type, category, amount, date FROM transactions ORDER BY {db_column} {direction}"
        if db_column != 'id':
            query += f", id {direction}"  # Secondary sort by id for consistency
        
        cursor.execute(query)
        transactions = cursor.fetchall()
        
        # Calculate balance before closing connection
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Income'")
        total_income = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Expense'")
        total_expenses = cursor.fetchone()[0]
        balance = total_income - total_expenses
        
        conn.close()

        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header in Hebrew (without פעולות column)
        writer.writerow(['תאריך', 'סכום', 'קטגוריה', 'סוג'])
        
        # Write data (without ID column, matching table display order)
        for transaction in transactions:
            writer.writerow([
                transaction['date'],
                f"{transaction['amount']:.2f}",
                transaction['category'],
                'הכנסה' if transaction['type'] == 'Income' else 'הוצאה'
            ])
        
        # Add empty row for separation
        writer.writerow([])
        
        # Add balance row
        writer.writerow([
            'יתרה:',
            f"{balance:.2f}",
            '',
            ''
        ])

        # Create response
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename=transactions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        response.headers['Content-Type'] = 'text/csv; charset=utf-8-sig'
        
        return response
    
    except Exception as e:
        print(f"Error exporting to CSV: {e}")
        return redirect(url_for('index'))

@app.route('/stats')
def stats():
    """Get statistics (for future API use)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get monthly statistics
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type='Income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type='Expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """)
        monthly_stats = cursor.fetchall()
        
        # Get category breakdown
        cursor.execute("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE type='Expense'
            GROUP BY category
            ORDER BY total DESC
        """)
        category_stats = cursor.fetchall()
        
        conn.close()
        
        return {
            'monthly': [dict(row) for row in monthly_stats],
            'categories': [dict(row) for row in category_stats]
        }
    
    except Exception as e:
        print(f"Error getting stats: {e}")
        return {'error': str(e)}, 500

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return redirect(url_for('index'))

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return redirect(url_for('index'))

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host='0.0.0.0', port=8080)
