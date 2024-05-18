import { catchError, of } from "rxjs";

export class ObservablesUtils{
  public static CATCH_ERRORS = catchError((err) => {
    return of(err);
  })
}