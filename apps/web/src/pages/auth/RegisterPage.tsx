import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { customerSchema, hotelOwnerSchema, type CustomerFormData, type HotelOwnerFormData } from '../../lib/validations/registerSchema';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';

export const RegisterPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { login, dispatch } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'customer' | 'hotel_owner'>('customer');

  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const hotelOwnerForm = useForm<HotelOwnerFormData>({
    resolver: zodResolver(hotelOwnerSchema),
  });

  const onCustomerSubmit = async (data: CustomerFormData) => {
    if (data.password !== data.confirmPassword) {
      customerForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setError(null);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await api.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: 'customer',
      });
      const { token, user } = response.data;
      login(token, user);
      toast.success('Registration successful!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const onHotelOwnerSubmit = async (data: HotelOwnerFormData) => {
    if (data.password !== data.confirmPassword) {
      hotelOwnerForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setError(null);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await api.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: 'hotel_owner',
        hotelName: data.hotelName,
        address: data.address,
        phone: data.phone,
      });
      const { token, user } = response.data;
      login(token, user);
      toast.success('Registration successful!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Choose your account type to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="hotel_owner">Hotel Owner</TabsTrigger>
            </TabsList>

            <TabsContent value="customer">
              <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerFirstName">First Name</Label>
                    <Input id="customerFirstName" {...customerForm.register('firstName')} />
                    {customerForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{String(customerForm.formState.errors.firstName.message)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerLastName">Last Name</Label>
                    <Input id="customerLastName" {...customerForm.register('lastName')} />
                    {customerForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{String(customerForm.formState.errors.lastName.message)}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input id="customerEmail" type="email" {...customerForm.register('email')} />
                  {customerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{String(customerForm.formState.errors.email.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPassword">Password</Label>
                  <Input id="customerPassword" type="password" {...customerForm.register('password')} />
                  {customerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{String(customerForm.formState.errors.password.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerConfirmPassword">Confirm Password</Label>
                  <Input id="customerConfirmPassword" type="password" {...customerForm.register('confirmPassword')} />
                  {customerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{String(customerForm.formState.errors.confirmPassword.message)}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={customerForm.formState.isSubmitting}>
                  {customerForm.formState.isSubmitting ? <LoadingSpinner /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="hotel_owner">
              <form onSubmit={hotelOwnerForm.handleSubmit(onHotelOwnerSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFirstName">First Name</Label>
                    <Input id="ownerFirstName" {...hotelOwnerForm.register('firstName')} />
                    {hotelOwnerForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.firstName.message)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerLastName">Last Name</Label>
                    <Input id="ownerLastName" {...hotelOwnerForm.register('lastName')} />
                    {hotelOwnerForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.lastName.message)}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email</Label>
                  <Input id="ownerEmail" type="email" {...hotelOwnerForm.register('email')} />
                  {hotelOwnerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.email.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Password</Label>
                  <Input id="ownerPassword" type="password" {...hotelOwnerForm.register('password')} />
                  {hotelOwnerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.password.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerConfirmPassword">Confirm Password</Label>
                  <Input id="ownerConfirmPassword" type="password" {...hotelOwnerForm.register('confirmPassword')} />
                  {hotelOwnerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.confirmPassword.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input id="hotelName" {...hotelOwnerForm.register('hotelName')} />
                  {hotelOwnerForm.formState.errors.hotelName && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.hotelName.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerAddress">Hotel Address</Label>
                  <Input id="ownerAddress" {...hotelOwnerForm.register('address')} />
                  {hotelOwnerForm.formState.errors.address && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.address.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Phone Number</Label>
                  <Input id="ownerPhone" type="tel" {...hotelOwnerForm.register('phone')} />
                  {hotelOwnerForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{String(hotelOwnerForm.formState.errors.phone.message)}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={hotelOwnerForm.formState.isSubmitting}>
                  {hotelOwnerForm.formState.isSubmitting ? <LoadingSpinner /> : 'Register Hotel Owner'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
