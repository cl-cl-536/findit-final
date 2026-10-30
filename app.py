"""
FindIt – A Cloud-Based Lost and Found Item Management System
Main Flask Application Server
"""

import os
import uuid
import boto3
from functools import wraps
from datetime import datetime

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from models import db, User, Item

# Load environment variables
load_dotenv()

# Initialize Flask application
app = Flask(__name__)

# Application Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'findit-campus-cloud-mini-project-secret-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    f"sqlite:///{os.path.join(app.instance_path, 'findit.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # Max 5MB file uploads
# AWS S3 Configuration
app.config['S3_BUCKET'] = os.environ.get('S3_BUCKET')
app.config['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')

# Create S3 client only when a bucket is configured
if app.config['S3_BUCKET']:
    app.extensions['s3_client'] = boto3.client(
        's3',
        region_name=app.config['AWS_REGION']
    )
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Initialize SQLAlchemy
db.init_app(app)


# ------------------------------------------------------------------------------
# Security & Access Control Decorators
# ------------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in with administrator credentials.', 'error')
            return redirect(url_for('login', next=request.url))
        if session.get('user_role') != 'admin':
            flash('Access denied: Administrator privileges required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


# ------------------------------------------------------------------------------
# Helper Utilities
# ------------------------------------------------------------------------------
def allowed_file(filename):
    """Check if uploaded file has a safe and allowed image extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file):
    """Safely store uploaded images in S3 or locally during development."""
    if file and file.filename and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_name = (
            f"{uuid.uuid4().hex}_"
            f"{secure_filename(file.filename.rsplit('.', 1)[0])[:30]}.{ext}"
        )

        # Upload to private S3 bucket when configured
        if app.config.get('S3_BUCKET'):
            s3_client = app.extensions['s3_client']
            s3_client.upload_fileobj(
                file,
                app.config['S3_BUCKET'],
                unique_name,
                ExtraArgs={'ContentType': file.mimetype or 'application/octet-stream'}
            )
            return unique_name

        # Local storage for development
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        file.save(filepath)
        return unique_name

    return None


@app.context_processor
def inject_global_data():
    """Make current user info and categories available to all templates."""
    return {
        'current_user': {
            'id': session.get('user_id'),
            'name': session.get('user_name'),
            'email': session.get('user_email'),
            'role': session.get('user_role')
        } if 'user_id' in session else None,
        'categories': ['Electronics', 'Accessories', 'Books', 'ID Cards', 'Bags', 'Other']
    }


# ------------------------------------------------------------------------------
# Core Application Routes
# ------------------------------------------------------------------------------

@app.route('/')
def index():
    """Home landing page with metrics, recent reports & how-it-works."""
    total_items = Item.query.count()
    found_items = Item.query.filter_by(report_type='found').count()
    returned_items = Item.query.filter_by(status='Returned').count()
    recent_items = Item.query.order_by(Item.id.desc()).limit(6).all()

    return render_template(
        'index.html',
        total_items=total_items,
        found_items=found_items,
        returned_items=returned_items,
        recent_items=recent_items
    )


@app.route('/browse')
def browse():
    """Public searchable item directory with category, type & status filters."""
    query = Item.query

    # Search by keyword (item_name, description, location)
    q = request.args.get('q', '').strip()
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            db.or_(
                Item.item_name.ilike(search_pattern),
                Item.description.ilike(search_pattern),
                Item.location.ilike(search_pattern)
            )
        )

    # Filter by report type (lost / found)
    report_type = request.args.get('type', 'all').lower()
    if report_type in ['lost', 'found']:
        query = query.filter(Item.report_type == report_type)

    # Filter by category
    category = request.args.get('category', 'all')
    if category != 'all' and category:
        query = query.filter(Item.category == category)

    # Filter by status
    status = request.args.get('status', 'all')
    if status != 'all' and status:
        query = query.filter(db.func.lower(Item.status) == status.lower())

    items = query.order_by(Item.id.desc()).all()

    return render_template(
        'browse.html',
        items=items,
        current_type=report_type,
        current_category=category,
        current_status=status,
        search_query=q
    )


@app.route('/item/<int:item_id>')
def item_details(item_id):
    """Detailed showcase page for a specific lost or found item."""
    item = Item.query.get_or_404(item_id)
    
    # Recommendations in the same category
    related_items = Item.query.filter(
        Item.id != item.id,
        Item.category == item.category
    ).limit(3).all()

    if not related_items:
        related_items = Item.query.filter(Item.id != item.id).limit(3).all()

    return render_template(
        'item-details.html',
        item=item,
        related_items=related_items
    )


# ------------------------------------------------------------------------------
# Report Submission Routes (Protected)
# ------------------------------------------------------------------------------

@app.route('/report-lost', methods=['GET', 'POST'])
@login_required
def report_lost():
    """Submit a report for a missing personal item."""
    if request.method == 'POST':
        item_name = request.form.get('item_name', '').strip()
        category = request.form.get('category', '').strip()
        location = request.form.get('location', '').strip()
        report_date = request.form.get('report_date', '').strip()
        description = request.form.get('description', '').strip()
        contact_name = request.form.get('contact_name', '').strip()
        contact_email = request.form.get('contact_email', '').strip()
        contact_phone = request.form.get('contact_phone', '').strip()

        # Basic Validation
        if not (item_name and category and location and report_date and description and contact_name and contact_email):
            flash('Please fill in all required fields.', 'error')
            return render_template('report-lost.html')

        # Handle Image Upload
        image_file = request.files.get('image')
        saved_image_name = None
        if image_file and image_file.filename:
            saved_image_name = save_uploaded_file(image_file)

        # Contact composite
        contact_info = f"{contact_name} ({contact_email})"

        # Create Database Item
        new_item = Item(
            user_id=session['user_id'],
            item_name=item_name,
            category=category,
            description=description,
            report_type='lost',
            location=location,
            report_date=report_date,
            image_filename=saved_image_name,
            contact=contact_info,
            contact_phone=contact_phone,
            status='Active'
        )

        db.session.add(new_item)
        db.session.commit()

        flash(f"Lost report for '{item_name}' was successfully posted to the campus directory!", 'success')
        return redirect(url_for('item_details', item_id=new_item.id))

    return render_template('report-lost.html')


@app.route('/report-found', methods=['GET', 'POST'])
@login_required
def report_found():
    """Submit a report for a discovered item on campus."""
    if request.method == 'POST':
        item_name = request.form.get('item_name', '').strip()
        category = request.form.get('category', '').strip()
        location = request.form.get('location', '').strip()
        report_date = request.form.get('report_date', '').strip()
        description = request.form.get('description', '').strip()
        contact_name = request.form.get('contact_name', '').strip()
        contact_email = request.form.get('contact_email', '').strip()
        contact_phone = request.form.get('contact_phone', '').strip()

        if not (item_name and category and location and report_date and description and contact_name and contact_email):
            flash('Please fill in all required fields.', 'error')
            return render_template('report-found.html')

        image_file = request.files.get('image')
        saved_image_name = None
        if image_file and image_file.filename:
            saved_image_name = save_uploaded_file(image_file)

        contact_info = f"{contact_name} ({contact_email})"

        new_item = Item(
            user_id=session['user_id'],
            item_name=item_name,
            category=category,
            description=description,
            report_type='found',
            location=location,
            report_date=report_date,
            image_filename=saved_image_name,
            contact=contact_info,
            contact_phone=contact_phone,
            status='Active'
        )

        db.session.add(new_item)
        db.session.commit()

        flash(f"Found report for '{item_name}' successfully submitted! Thank you.", 'success')
        return redirect(url_for('item_details', item_id=new_item.id))

    return render_template('report-found.html')


# ------------------------------------------------------------------------------
# Authentication Routes
# ------------------------------------------------------------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Register a new student or staff account with hashed password."""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Input Validation
        if not (name and email and password and confirm_password):
            flash('All registration fields are required.', 'error')
            return render_template('register.html')

        if '@' not in email:
            flash('Please enter a valid college email address.', 'error')
            return render_template('register.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')

        # Check existing email
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('An account with this campus email already exists.', 'error')
            return render_template('register.html')

        # Create new user with hashed password
        hashed_password = generate_password_hash(password)
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            role='user'
        )

        db.session.add(new_user)
        db.session.commit()

        # Auto-login upon registration
        session['user_id'] = new_user.id
        session['user_name'] = new_user.name
        session['user_email'] = new_user.email
        session['user_role'] = new_user.role

        flash(f"Welcome to FindIt, {new_user.name}! Your account is now active.", 'success')
        return redirect(url_for('dashboard'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Authenticate campus members and establish session."""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        if not email or not password:
            flash('Please provide both your college email and password.', 'error')
            return render_template('login.html')

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_email'] = user.email
            session['user_role'] = user.role

            flash(f"Welcome back, {user.name}!", 'success')

            # Redirect to next parameter or appropriate dashboard
            next_url = request.args.get('next')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)

            if user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('dashboard'))

        flash('Invalid college email or password. Please try again.', 'error')

    return render_template('login.html')


@app.route('/logout')
def logout():
    """Safely terminate user session."""
    session.clear()
    flash('You have been signed out successfully.', 'success')
    return redirect(url_for('index'))


# ------------------------------------------------------------------------------
# Dashboard & Management Routes
# ------------------------------------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    """User personal dashboard showing submitted reports and statuses."""
    user_id = session['user_id']
    user_reports = Item.query.filter_by(user_id=user_id).order_by(Item.id.desc()).all()

    total_count = len(user_reports)
    lost_count = sum(1 for item in user_reports if item.report_type == 'lost')
    found_count = sum(1 for item in user_reports if item.report_type == 'found')
    returned_count = sum(1 for item in user_reports if item.status == 'Returned')

    return render_template(
        'dashboard.html',
        reports=user_reports,
        total_count=total_count,
        lost_count=lost_count,
        found_count=found_count,
        returned_count=returned_count
    )


@app.route('/item/<int:item_id>/status', methods=['POST'])
@login_required
def update_status(item_id):
    """Allow reporter or administrator to update an item's status."""
    item = Item.query.get_or_404(item_id)

    # Permission check: must be owner or admin
    if item.user_id != session['user_id'] and session.get('user_role') != 'admin':
        abort(403)

    new_status = request.form.get('status', '').strip()
    if new_status in ['Active', 'Returned', 'Pending']:
        item.status = new_status
        db.session.commit()
        flash(f"Status for '{item.item_name}' updated to {new_status}!", 'success')
    else:
        flash('Invalid status provided.', 'error')

    # Return to previous page or dashboard
    return redirect(request.referrer or url_for('dashboard'))


@app.route('/admin')
@admin_required
def admin_dashboard():
    """Campus administration dashboard for moderation and status oversight."""
    query = Item.query

    # Admin search
    q = request.args.get('q', '').strip()
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            db.or_(
                Item.item_name.ilike(search_pattern),
                Item.category.ilike(search_pattern),
                Item.location.ilike(search_pattern),
                Item.contact.ilike(search_pattern)
            )
        )

    # Admin type filter
    report_type = request.args.get('type', 'all').lower()
    if report_type in ['lost', 'found']:
        query = query.filter(Item.report_type == report_type)

    # Admin status filter
    status = request.args.get('status', 'all')
    if status != 'all' and status:
        query = query.filter(db.func.lower(Item.status) == status.lower())

    reports = query.order_by(Item.id.desc()).all()

    # System-wide metrics
    total_reports = Item.query.count()
    lost_reports = Item.query.filter_by(report_type='lost').count()
    found_reports = Item.query.filter_by(report_type='found').count()
    returned_reports = Item.query.filter_by(status='Returned').count()

    return render_template(
        'admin.html',
        reports=reports,
        total_reports=total_reports,
        lost_reports=lost_reports,
        found_reports=found_reports,
        returned_reports=returned_reports,
        current_type=report_type,
        current_status=status,
        search_query=q
    )


@app.route('/admin/item/<int:item_id>/delete', methods=['POST'])
@admin_required
def admin_delete_item(item_id):
    """Permanently delete a report and its uploaded S3 image."""
    item = Item.query.get_or_404(item_id)
    title = item.item_name
    image_filename = item.image_filename

    # Delete uploaded photograph from S3
    if image_filename and not image_filename.endswith('.svg'):
        if app.config.get('S3_BUCKET'):
            try:
                s3_client = app.extensions.get('s3_client')
                if s3_client:
                    s3_client.delete_object(
                        Bucket=app.config['S3_BUCKET'],
                        Key=image_filename
                    )
            except Exception:
                app.logger.exception("Could not delete image from S3.")

    db.session.delete(item)
    db.session.commit()

    flash(f"Report '{title}' was removed from the database.", 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/contact-reporter', methods=['POST'])
def contact_reporter():
    """Mock endpoint to dispatch message to an item reporter."""
    sender_name = request.form.get('sender_name', '').strip()
    sender_email = request.form.get('sender_email', '').strip()
    message = request.form.get('message', '').strip()
    item_id = request.form.get('item_id')

    if not (sender_name and sender_email and message):
        flash('Please fill in all inquiry fields.', 'error')
    else:
        flash(f"Inquiry sent to reporter! They will reach out to {sender_email}.", 'success')

    if item_id:
        return redirect(url_for('item_details', item_id=item_id))
    return redirect(url_for('browse'))


# ------------------------------------------------------------------------------
# Database Initialization & Realistic Demo Seeding
# ------------------------------------------------------------------------------
def init_db():
    """Initialize SQLite tables and pre-populate realistic sample data."""
    with app.app_context():
        os.makedirs(app.instance_path, exist_ok=True)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        db.create_all()

        # Seed initial Administrator account from environment variables
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@campus.edu').strip().lower()
        admin_pass = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_name = os.environ.get('ADMIN_NAME', 'Campus Administrator')

        admin_user = User.query.filter_by(role='admin').first()
        if not admin_user:
            admin_user = User(
                name=admin_name,
                email=admin_email,
                password=generate_password_hash(admin_pass),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()

        # Seed demo student Jordan Smith if not exists
        student_user = User.query.filter_by(email='student@campus.edu').first()
        if not student_user:
            student_user = User(
                name='Jordan Smith',
                email='student@campus.edu',
                password=generate_password_hash('student123'),
                role='user'
            )
            db.session.add(student_user)
            db.session.commit()

        # Seed realistic campus items if database is empty
        if Item.query.count() == 0:
            sample_items = [
                Item(
                    user_id=student_user.id,
                    item_name='Black Wireless Headphones',
                    category='Electronics',
                    report_type='lost',
                    location='Central Library, 2nd Floor Study Cubicle 14',
                    report_date='2026-10-28',
                    description='Sony WH-1000XM4 matte black over-ear noise cancelling headphones. Has a small scratch near the left hinge and includes a zippered black protective case.',
                    image_filename='headphones.svg',
                    contact='Jordan Smith (student@campus.edu)',
                    contact_phone='+1 (555) 234-5678',
                    status='Active'
                ),
                Item(
                    user_id=admin_user.id,
                    item_name='Blue Water Bottle',
                    category='Accessories',
                    report_type='found',
                    location='Engineering Block C, Cafeteria Corner Table',
                    report_date='2026-10-29',
                    description='32oz hydro-insulated vacuum bottle in cobalt blue with a black twist lid and carry loop. Has a campus robotics club sticker on the front.',
                    image_filename='waterbottle.svg',
                    contact='Campus Security Desk (security@campus.edu)',
                    contact_phone='+1 (555) 890-1234',
                    status='Active'
                ),
                Item(
                    user_id=admin_user.id,
                    item_name='Student ID Card',
                    category='ID Cards',
                    report_type='found',
                    location='Auditorium Main Entrance Lobby',
                    report_date='2026-10-29',
                    description='Official College Identity Card belonging to Alex Chen, Department of Computer Science (Roll ID: #CS2024-884). Attached to a blue campus ribbon lanyard.',
                    image_filename='idcard.svg',
                    contact='Lost & Found Center (lostfound@campus.edu)',
                    contact_phone='+1 (555) 345-6789',
                    status='Active'
                ),
                Item(
                    user_id=student_user.id,
                    item_name='Brown Leather Wallet',
                    category='Accessories',
                    report_type='lost',
                    location='Sports Complex Bleachers near Court 2',
                    report_date='2026-10-27',
                    description='Fossil bi-fold dark brown leather wallet. Contains college metro card, driver license, and campus library pass. Great sentimental value.',
                    image_filename='wallet.svg',
                    contact='Jordan Smith (student@campus.edu)',
                    contact_phone='+1 (555) 234-5678',
                    status='Active'
                ),
                Item(
                    user_id=admin_user.id,
                    item_name='Laptop Charger',
                    category='Electronics',
                    report_type='found',
                    location='Lab 304, Computer Science Block',
                    report_date='2026-10-26',
                    description='Dell 65W USB-C power adapter with long rubber cable wrap and indicator light. Left plugged into row 3 power strip.',
                    image_filename='charger.svg',
                    contact='Lab Assistant Mark (lab304@campus.edu)',
                    contact_phone='+1 (555) 456-7890',
                    status='Returned'
                ),
                Item(
                    user_id=student_user.id,
                    item_name='College Backpack',
                    category='Bags',
                    report_type='lost',
                    location='Student Center Lounge, 1st Floor',
                    report_date='2026-10-28',
                    description='North Face heather grey daypack with black trim. Contains 2 engineering spiral notebooks, graph paper, and a Casio scientific calculator.',
                    image_filename='backpack.svg',
                    contact='Samantha Ray (samantha.ray@campus.edu)',
                    contact_phone='+1 (555) 567-8901',
                    status='Active'
                ),
                Item(
                    user_id=admin_user.id,
                    item_name='Calculus Textbook',
                    category='Books',
                    report_type='found',
                    location='Lecture Hall B, Row G Seat 12',
                    report_date='2026-10-29',
                    description='Stewart Calculus Early Transcendentals 9th Edition. Blue hardback with red ribbon bookmark and handwritten notes in chapter 4.',
                    image_filename='textbook.svg',
                    contact='Prof. Miller Office (mathdept@campus.edu)',
                    contact_phone='+1 (555) 678-9012',
                    status='Active'
                ),
                Item(
                    user_id=student_user.id,
                    item_name='Campus Keys with Lanyard',
                    category='Other',
                    report_type='lost',
                    location='North Parking Lot Bay 4 near Bike Racks',
                    report_date='2026-10-27',
                    description='Set of 3 keys including a Toyota car key fob and campus dorm key, on a navy blue lanyard with yellow campus lettering.',
                    image_filename='keys.svg',
                    contact='Jordan Smith (student@campus.edu)',
                    contact_phone='+1 (555) 234-5678',
                    status='Pending'
                )
            ]
            db.session.bulk_save_objects(sample_items)
            db.session.commit()


# Run database initialization
init_db()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)

