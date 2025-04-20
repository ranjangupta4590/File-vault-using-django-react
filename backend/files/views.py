from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, calculate_file_hash, calculate_file_size
from .serializers import FileSerializer
from django.db.models import Sum
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def create(self, request, *args, **kwargs):
        try:
            file_obj = request.FILES.get('file')
            if not file_obj:
                return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate file hash and size
            file_hash = calculate_file_hash(file_obj)
            file_size = calculate_file_size(file_obj)
            
            # Check for existing file with same hash
            existing_file = File.objects.filter(file_hash=file_hash).first()
            if existing_file:
                # Increment reference count
                existing_file.reference_count += 1
                existing_file.save()
                
                # Return existing file data
                serializer = self.get_serializer(existing_file)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            data = {
                'file': file_obj,
                'original_filename': file_obj.name,
                'file_type': file_obj.content_type,
                'size': file_size,
                'file_hash': file_hash
            }
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return Response(
                {'error': 'An error occurred while processing the file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def storage_savings(self, request):
        """Calculate storage savings from deduplication"""
        try:
            total_size = File.objects.aggregate(total=Sum('size'))['total'] or 0
            unique_size = File.objects.values('file_hash').distinct().aggregate(total=Sum('size'))['total'] or 0
            savings = total_size - unique_size
            
            return Response({
                'total_size': total_size,
                'unique_size': unique_size,
                'savings': savings,
                'savings_percentage': (savings / total_size * 100) if total_size > 0 else 0
            })
        except Exception as e:
            logger.error(f"Error calculating storage savings: {str(e)}")
            return Response(
                {'error': 'An error occurred while calculating storage savings'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
