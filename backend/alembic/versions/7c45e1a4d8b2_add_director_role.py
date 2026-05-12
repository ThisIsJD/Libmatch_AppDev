"""add_director_role

Revision ID: 7c45e1a4d8b2
Revises: 39385cbbf494
Create Date: 2026-05-12 17:45:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7c45e1a4d8b2"
down_revision: Union[str, None] = "39385cbbf494"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT ck_users_users_role_valid")
    op.execute(
        "ALTER TABLE users "
        "ADD CONSTRAINT ck_users_users_role_valid "
        "CHECK (role IN ('faculty', 'cataloger', 'librarian', 'director'))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT ck_users_users_role_valid")
    op.execute(
        "ALTER TABLE users "
        "ADD CONSTRAINT ck_users_users_role_valid "
        "CHECK (role IN ('faculty', 'cataloger', 'librarian'))"
    )
