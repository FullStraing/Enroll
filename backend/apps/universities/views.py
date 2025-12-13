from rest_framework import generics, permissions
from .models import University, StudentUniversity
from .serializers import UniversitySerializer, StudentUniversitySerializer


class UniversityListView(generics.ListAPIView):
    queryset = University.objects.all().order_by("name")
    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated]


class UniversityDetailView(generics.RetrieveAPIView):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentUniversityListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentUniversity.objects.filter(student=self.request.user).select_related("university").order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class StudentUniversityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentUniversity.objects.filter(student=self.request.user).select_related("university")
