import { catchError, of } from "rxjs";

export class ObservablesUtils{
  public static CATCH_ERRORS = catchError((err) => {
    console.log(err);
    return of(err);
  })
}