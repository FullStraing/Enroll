from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient

from apps.universities.models import University, StudentUniversity
from .constants import MAX_DOCUMENTS_PER_USER, MAX_DOCUMENT_FILE_SIZE_BYTES
from .models import Document


class DocumentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.university = University.objects.create(name="Brown University", country="USA")
        self.student_university = StudentUniversity.objects.create(student=self.user, university=self.university)

    def test_create_document_upload(self):
        file = SimpleUploadedFile(
            "resume.pdf",
            b"%PDF-1.4 test file",
            content_type="application/pdf",
        )

        response = self.client.post(
            reverse("documents_list_create"),
            {
                "title": "Main Resume",
                "type": "resume",
                "student_university_id": self.student_university.id,
                "file": file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["title"], "Main Resume")
        self.assertEqual(response.data["type"], "resume")
        self.assertEqual(response.data["file_name"], "resume.pdf")
        self.assertEqual(response.data["mime_type"], "application/pdf")
        self.assertEqual(response.data["student_university"]["university"]["name"], "Brown University")
        self.assertTrue(response.data["download_url"])

    def test_list_documents_is_owner_scoped(self):
        other_user = User.objects.create_user(username="other", password="password123")
        Document.objects.create(
            user=other_user,
            title="Other Resume",
            type="resume",
            file=SimpleUploadedFile("other.pdf", b"file", content_type="application/pdf"),
            file_name="other.pdf",
            mime_type="application/pdf",
            file_size=4,
        )
        Document.objects.create(
            user=self.user,
            title="My Transcript",
            type="transcript",
            file=SimpleUploadedFile("mine.pdf", b"file", content_type="application/pdf"),
            file_name="mine.pdf",
            mime_type="application/pdf",
            file_size=4,
        )

        response = self.client.get(reverse("documents_list_create"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My Transcript")

    def test_delete_document(self):
        document = Document.objects.create(
            user=self.user,
            title="Passport",
            type="passport",
            file=SimpleUploadedFile("passport.pdf", b"file", content_type="application/pdf"),
            file_name="passport.pdf",
            mime_type="application/pdf",
            file_size=4,
        )

        response = self.client.delete(reverse("documents_detail", kwargs={"pk": document.id}))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(pk=document.id).exists())

    def test_rename_document(self):
        document = Document.objects.create(
            user=self.user,
            title="scan_123.pdf",
            type="transcript",
            file=SimpleUploadedFile("scan_123.pdf", b"file", content_type="application/pdf"),
            file_name="scan_123.pdf",
            mime_type="application/pdf",
            file_size=4,
        )

        response = self.client.patch(
            reverse("documents_detail", kwargs={"pk": document.id}),
            {"title": "High School Transcript"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        document.refresh_from_db()
        self.assertEqual(document.title, "High School Transcript")

    def test_create_document_rejects_large_file(self):
        oversized = SimpleUploadedFile(
            "large.pdf",
            b"a" * (MAX_DOCUMENT_FILE_SIZE_BYTES + 1),
            content_type="application/pdf",
        )

        response = self.client.post(
            reverse("documents_list_create"),
            {
                "title": "Large File",
                "type": "other",
                "file": oversized,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("file", response.data)

    def test_create_document_rejects_when_limit_reached(self):
        for index in range(MAX_DOCUMENTS_PER_USER):
            document = Document(
                user=self.user,
                title=f"Document {index + 1}",
                type="other",
                file_name=f"document-{index + 1}.pdf",
                mime_type="application/pdf",
                file_size=4,
            )
            document.file.save(f"document-{index + 1}.pdf", ContentFile(b"file"), save=False)
            document.save()

        response = self.client.post(
            reverse("documents_list_create"),
            {
                "title": "Overflow",
                "type": "resume",
                "file": SimpleUploadedFile("overflow.pdf", b"file", content_type="application/pdf"),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"][0], f"You can store up to {MAX_DOCUMENTS_PER_USER} documents.")
