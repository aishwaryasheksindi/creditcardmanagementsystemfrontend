import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Statement, StatementItem } from '../models/statement.model';

@Injectable({
  providedIn: 'root'
})
export class StatementService {
  private readonly baseUrl = `${environment.apiBaseUrl}/statements`;
  private readonly itemBaseUrl = `${environment.apiBaseUrl}/statement-items`;

  constructor(private http: HttpClient) {}

  public getStatementsByCardId(cardId: string): Observable<Statement[]> {
    return this.http.get<Statement[]>(`${this.baseUrl}/card/${cardId}`);
  }

  public getStatementById(statementId: string): Observable<Statement> {
    return this.http.get<Statement>(`${this.baseUrl}/${statementId}`);
  }

  public downloadStatement(statementId: string): Observable<Statement> {
    return this.http.get<Statement>(`${this.baseUrl}/${statementId}/download`);
  }

  public getAllStatements(): Observable<Statement[]> {
    return this.http.get<Statement[]>(this.baseUrl);
  }

  public getStatementItems(statementId: string): Observable<StatementItem[]> {
    return this.http.get<StatementItem[]>(`${this.itemBaseUrl}/statement/${statementId}`);
  }
}
