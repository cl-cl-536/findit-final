
"""
FindIt – A Cloud-Based Lost and Found Item Management System
Database Models Module (Flask-SQLAlchemy)
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask import current_app

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to Items submitted by this user
    items = db.relationship(
        'Item',
        backref='reporter',
        lazy=True,
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'


class Item(db.Model):
    __tablename__ = 'items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    report_type = db.Column(db.String(20), nullable=False, index=True)
    location = db.Column(db.String(150), nullable=False)
    report_date = db.Column(db.String(30), nullable=False)
    image_filename = db.Column(db.String(255), nullable=True)
    contact = db.Column(db.String(100), nullable=False)
    contact_phone = db.Column(db.String(50), nullable=True)
    status = db.Column(
        db.String(20),
        nullable=False,
        default='Active',
        index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Item {self.item_name} [{self.report_type}] - {self.status}>'

    def get_image_url(self):
        """Generate image URL from S3 or use local images."""

        if not self.image_filename:
            return self._category_fallback()

        # Seeded SVG images remain stored locally
        if self.image_filename.endswith('.svg'):
            return f'/static/images/{self.image_filename}'

        # Generate a temporary URL for private S3 images
        bucket = current_app.config.get('S3_BUCKET')

        if bucket:
            s3_client = current_app.extensions.get('s3_client')

            if s3_client:
                return s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': bucket,
                        'Key': self.image_filename
                    },
                    ExpiresIn=3600
                )

        # Local development fallback
        return f'/static/uploads/{self.image_filename}'

    def _category_fallback(self):
        """Return a default SVG image based on item category."""

        fallbacks = {
            'Electronics': '/static/images/headphones.svg',
            'Accessories': '/static/images/wallet.svg',
            'Books': '/static/images/textbook.svg',
            'ID Cards': '/static/images/idcard.svg',
            'Bags': '/static/images/backpack.svg'
        }

        return fallbacks.get(
            self.category,
            '/static/images/keys.svg'
        )
