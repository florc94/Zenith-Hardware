import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Review,
  CreateReviewRequest
} from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/reviews`;

  getReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.apiUrl}/product/${productId}`
    );
  }

  createReview(
    productId: number,
    review: CreateReviewRequest
  ): Observable<{
    message: string;
    review: Review;
  }> {
    return this.http.post<{
      message: string;
      review: Review;
    }>(
      `${this.apiUrl}/product/${productId}`,
      review
    );
  }

  deleteReview(reviewId: number): Observable<{
    message: string;
  }> {
    return this.http.delete<{
      message: string;
    }>(
      `${this.apiUrl}/${reviewId}`
    );
  }
}