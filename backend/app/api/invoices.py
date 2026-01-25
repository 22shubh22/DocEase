from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from decimal import Decimal
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Invoice, InvoiceItem
from app.schemas.schemas import InvoiceCreate, InvoiceUpdate

router = APIRouter()


@router.get("/", response_model=dict)
async def get_all_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invoices with pagination"""
    skip = (page - 1) * limit

    query = db.query(Invoice).filter(Invoice.clinic_id == current_user.clinic_id)

    if status:
        query = query.filter(Invoice.payment_status == status)

    total = query.count()
    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "invoices": invoices,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new invoice"""
    # Generate invoice number
    last_invoice = db.query(Invoice).filter(
        Invoice.clinic_id == current_user.clinic_id
    ).order_by(Invoice.created_at.desc()).first()

    if last_invoice and last_invoice.invoice_number:
        last_number = int(last_invoice.invoice_number.split('-')[1])
        invoice_number = f"INV-{str(last_number + 1).zfill(4)}"
    else:
        invoice_number = "INV-0001"

    # Calculate total
    total_amount = sum(
        Decimal(str(item.amount)) * item.quantity
        for item in invoice_data.items
    )

    paid_amount = total_amount if invoice_data.payment_status == "PAID" else Decimal('0')

    invoice = Invoice(
        invoice_number=invoice_number,
        patient_id=invoice_data.patient_id,
        visit_id=invoice_data.visit_id,
        total_amount=total_amount,
        paid_amount=paid_amount,
        payment_status=invoice_data.payment_status,
        payment_mode=invoice_data.payment_mode,
        payment_date=invoice_data.payment_date,
        notes=invoice_data.notes,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id
    )

    db.add(invoice)
    db.flush()

    # Add invoice items
    for item_data in invoice_data.items:
        item = InvoiceItem(
            **item_data.model_dump(),
            invoice_id=invoice.id
        )
        db.add(item)

    db.commit()
    db.refresh(invoice)

    return {"message": "Invoice created successfully", "invoice": invoice}


@router.get("/{invoice_id}", response_model=dict)
async def get_invoice_by_id(
    invoice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get invoice by ID"""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.clinic_id == current_user.clinic_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return {"invoice": invoice}


@router.put("/{invoice_id}", response_model=dict)
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update invoice payment information"""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.clinic_id == current_user.clinic_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = invoice_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)

    return {"message": "Invoice updated successfully", "invoice": invoice}


@router.get("/stats/summary", response_model=dict)
async def get_billing_stats(
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get billing statistics"""
    query = db.query(Invoice).filter(Invoice.clinic_id == current_user.clinic_id)

    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        query = query.filter(Invoice.created_at.between(start, end))

    total_revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.clinic_id == current_user.clinic_id
    ).scalar() or Decimal('0')

    paid_revenue = db.query(func.sum(Invoice.paid_amount)).filter(
        Invoice.clinic_id == current_user.clinic_id,
        Invoice.payment_status == "PAID"
    ).scalar() or Decimal('0')

    unpaid_revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.clinic_id == current_user.clinic_id,
        Invoice.payment_status == "UNPAID"
    ).scalar() or Decimal('0')

    total_invoices = query.count()

    return {
        "totalRevenue": float(total_revenue),
        "paidRevenue": float(paid_revenue),
        "unpaidRevenue": float(unpaid_revenue),
        "totalInvoices": total_invoices
    }
