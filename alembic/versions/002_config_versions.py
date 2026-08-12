"""Create config_versions table for configuration lifecycle

Revision ID: 002_config_versions
Revises: 001_initial_users
Create Date: 2026-08-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_config_versions'
down_revision: Union[str, None] = '001_initial_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'config_versions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='candidate'),
        sa.Column('config_payload', sa.Text(), nullable=False),
        sa.Column('commit_message', sa.String(length=255), nullable=True),
        sa.Column('created_by', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('applied_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_config_versions_version_number'), 'config_versions', ['version_number'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_config_versions_version_number'), table_name='config_versions')
    op.drop_table('config_versions')
